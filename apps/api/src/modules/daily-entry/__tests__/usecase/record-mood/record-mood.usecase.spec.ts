import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { ForbiddenError } from "@/modules/@shared/domain/errors/forbidden.error";
import { DailyEntry } from "../../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import RecordMoodUseCase from "../../../usecase/record-mood/record-mood.usecase";
import { JourneyWindow } from "../../../domain/journey-window";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const lateInTheDay = new Date(Date.UTC(2026, 8, 19, 22, 40));
/**
 * Estes testes provam a regra do humor e da colheita, nao o horario. Uma janela
 * sempre aberta mantem cada teste sobre uma coisa so — a janela tem os seus em
 * `__tests__/domain/journey-window.spec.ts`, e a recusa fora dela tem o seu
 * caso proprio no fim deste arquivo.
 */
const ALWAYS_OPEN: JourneyWindow = {
  zone: "UTC",
  days: [0, 1, 2, 3, 4, 5, 6],
  opensAt: { hour: 0, minute: 0 },
  closesAt: { hour: 23, minute: 59 },
};

const gatewayWith = (existing: DailyEntry | null): DailyEntryGateway => ({
  findByDate: jest.fn().mockResolvedValue(existing),
  findAnsweredPieceIds: jest.fn().mockResolvedValue([]),
  findAnswers: jest.fn().mockResolvedValue(new Map<string, string>()),
  create: jest.fn(),
  update: jest.fn(),
});

describe("RecordMoodUseCase", () => {
  it("creates the entry for the normalized day", async () => {
    const gateway = gatewayWith(null);

    const output = await new RecordMoodUseCase(gateway, ALWAYS_OPEN).execute({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 4,
    });

    expect(gateway.create).toHaveBeenCalledTimes(1);
    expect(output.entryDate.toISOString()).toBe("2026-09-19T00:00:00.000Z");
  });

  it("refuses a second answer on the same day once the mood was declared", async () => {
    const existing = DailyEntry.create({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 2,
    });
    const gateway = gatewayWith(existing);

    await expect(
      new RecordMoodUseCase(gateway, ALWAYS_OPEN).execute({
        userId,
        companyId,
        entryDate: lateInTheDay,
        mood: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    // A resposta de hoje permanece como foi dada: a proxima chance e amanha.
    expect(gateway.create).not.toHaveBeenCalled();
    expect(gateway.update).not.toHaveBeenCalled();
    expect(existing.mood).toBe(2);
  });

  it("overwrites an automatic mood the harvest opened, and marks it declared", async () => {
    // A colheita abriu o dia com humor neutro automático; agora a pessoa
    // declara de verdade. O real sobrescreve o neutro, sem 409.
    const automatic = DailyEntry.createAutomatic(
      { userId, companyId, entryDate: lateInTheDay },
      3,
    );
    const gateway = gatewayWith(automatic);

    const output = await new RecordMoodUseCase(gateway, ALWAYS_OPEN).execute({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 5,
    });

    expect(gateway.update).toHaveBeenCalledTimes(1);
    expect(gateway.create).not.toHaveBeenCalled();
    expect(automatic.mood).toBe(5);
    expect(automatic.moodDeclared).toBe(true);
    expect(output.mood).toBe(5);
  });

  it("looks the day up by owner, never by user alone", async () => {
    const gateway = gatewayWith(null);

    await new RecordMoodUseCase(gateway, ALWAYS_OPEN).execute({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 3,
    });

    expect(gateway.findByDate).toHaveBeenCalledWith(
      { userId, companyId },
      new Date(Date.UTC(2026, 8, 19)),
    );
  });

  it("refuses to record outside the unit's working hours", async () => {
    // Sabado, 18:40 no relogio de Cuiaba. A tela nem chega a oferecer a
    // pergunta — este 403 e a rede para quem tentar pela API direto.
    const gateway = gatewayWith(null);

    await expect(
      new RecordMoodUseCase(gateway).execute({
        userId,
        companyId,
        entryDate: lateInTheDay,
        mood: 4,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(gateway.create).not.toHaveBeenCalled();
  });
});
