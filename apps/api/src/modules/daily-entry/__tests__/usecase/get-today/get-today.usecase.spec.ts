import { CoopsStage } from "@/modules/@shared/domain/enums";
import { ContentPiece } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntry } from "../../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetTodayEntryUseCase from "../../../usecase/get-today/get-today.usecase";
import { companyGatewayDouble } from "@/modules/company/__tests__/company-gateway.double";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const lateInTheDay = new Date(Date.UTC(2026, 8, 19, 22, 40));

const piece: ContentPiece = {
  id: "8b3d5f7a-2c4e-4d6f-9a1b-3c5d7e9f0a1b",
  stage: CoopsStage.OBSERVAR,
  orderInStage: 1,
  title: "Para onde o dinheiro foi",
  body: "Observar é o segundo passo do COOPS.",
  prompt: "Sobrou R$ 50 este mês. O que você faz?",
  options: [
    {
      label: "Guardo",
      outcome: "Vira reserva.",
      demonstratesComprehension: true,
    },
    {
      label: "Deixo na conta",
      outcome: "Some no mês.",
      demonstratesComprehension: false,
    },
  ],
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const dailyGateway = (existing: DailyEntry | null): DailyEntryGateway => ({
  findByDate: jest.fn().mockResolvedValue(existing),
  findAnsweredPieceIds: jest.fn().mockResolvedValue([]),
  findAnswers: jest.fn().mockResolvedValue(new Map<string, string>()),
  findEntryDates: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
});

const contentGateway = (next: ContentPiece | null): ContentPieceGateway => ({
  findById: jest.fn().mockResolvedValue(next),
  findAll: jest.fn().mockResolvedValue(next ? [next] : []),
  findNext: jest.fn().mockResolvedValue(next),
  countByStage: jest.fn(),
});

const entryWithMood = () =>
  DailyEntry.create({ userId, companyId, entryDate: lateInTheDay, mood: 4 });

describe("GetTodayEntryUseCase", () => {
  it("asks for the mood before offering any content", async () => {
    const content = contentGateway(piece);

    const output = await new GetTodayEntryUseCase(
      dailyGateway(null),
      content,
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });

    expect(output.answered).toBe(false);
    expect(output.piece).toBeNull();
    expect(content.findNext).not.toHaveBeenCalled();
  });

  it("offers the next piece once the mood is answered", async () => {
    const output = await new GetTodayEntryUseCase(
      dailyGateway(entryWithMood()),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });

    expect(output.answered).toBe(true);
    expect(output.mood).toBe(4);
    expect(output.pieceAnswered).toBe(false);
    expect(output.piece?.title).toBe(piece.title);
  });

  it("echoes the personal note back to its owner", async () => {
    const entry = DailyEntry.create({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 2,
      note: "Preocupado com o mês.",
    });

    const output = await new GetTodayEntryUseCase(
      dailyGateway(entry),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });

    expect(output.note).toBe("Preocupado com o mês.");
  });

  it("returns a null note when there is none, and none before the mood", async () => {
    const answered = await new GetTodayEntryUseCase(
      dailyGateway(entryWithMood()),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });
    expect(answered.note).toBeNull();

    const unanswered = await new GetTodayEntryUseCase(
      dailyGateway(null),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });
    expect(unanswered.note).toBeNull();
  });

  it("hides the outcome of each option until the person chooses", async () => {
    const output = await new GetTodayEntryUseCase(
      dailyGateway(entryWithMood()),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });

    expect(output.piece?.options).toEqual([
      { label: "Guardo" },
      { label: "Deixo na conta" },
    ]);
  });

  it("stops offering content after the piece is answered", async () => {
    const entry = entryWithMood();
    entry.answerPiece(piece.id, "Guardo", true);

    const output = await new GetTodayEntryUseCase(
      dailyGateway(entry),
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({ userId, companyId, today: lateInTheDay });

    expect(output.pieceAnswered).toBe(true);
    expect(output.piece).toBeNull();
  });

  it("asks the gateway for the owner, never for the user alone", async () => {
    const daily = dailyGateway(null);

    await new GetTodayEntryUseCase(
      daily,
      contentGateway(piece),
      companyGatewayDouble(),
    ).execute({
      userId,
      companyId,
      today: lateInTheDay,
    });

    expect(daily.findByDate).toHaveBeenCalledWith(
      { userId, companyId },
      new Date(Date.UTC(2026, 8, 19)),
    );
  });
});
