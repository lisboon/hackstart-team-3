import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetStreakUseCase from "../../../usecase/get-streak/get-streak.usecase";
import { companyGatewayDouble } from "@/modules/company/__tests__/company-gateway.double";
import {
  JourneyWindow,
  uniformShifts,
} from "@/modules/company/domain/journey-window";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const owner = { userId, companyId };

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const gateway = (dates: Date[]): DailyEntryGateway => ({
  findByDate: jest.fn(),
  findAnsweredPieceIds: jest.fn(),
  findAnswers: jest.fn(),
  findEntryDates: jest.fn().mockResolvedValue(dates),
  create: jest.fn(),
  update: jest.fn(),
});

/**
 * A unidade padrão: segunda a sexta. Sem faixa própria o caso de uso cai no
 * padrão do processo, que é exatamente isso — então o dublê devolve `null`.
 */
const defaultUnit = () => companyGatewayDouble();

/** Uma unidade seg–sex com os dias de exceção que o teste quiser fechar. */
const unitClosedOn = (...dates: string[]) => {
  const window: JourneyWindow = {
    zone: "UTC",
    shifts: uniformShifts([1, 2, 3, 4, 5], 450, 1080),
    exceptions: dates,
  };
  return companyGatewayDouble({
    findJourneyWindow: jest.fn().mockResolvedValue(window),
  });
};

// Uma quarta-feira, para termos dias antes (seg/ter) e depois (qui..dom).
const WEDNESDAY = day("2026-09-16");

describe("GetStreakUseCase", () => {
  it("returns zero for someone with no entries", async () => {
    const out = await new GetStreakUseCase(gateway([]), defaultUnit()).execute({
      ...owner,
      today: WEDNESDAY,
    });
    expect(out.currentStreak).toBe(0);
    expect(out.longestStreak).toBe(0);
    expect(out.week).toHaveLength(7);
    expect(out.week.every((d) => d.state !== "done")).toBe(true);
  });

  it("counts consecutive days ending today", async () => {
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-15"), day("2026-09-16")]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.currentStreak).toBe(3);
  });

  it("keeps the streak when today is not done yet, counting up to yesterday", async () => {
    // Hoje (qua) ainda não registrado; seg e ter sim. O dia corrente está em
    // aberto e não quebra a ofensiva.
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-15")]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.currentStreak).toBe(2);
    expect(out.week.find((d) => d.weekday === 2)?.state).toBe("today");
  });

  it("reports the personal record as the longest run ever", async () => {
    // Uma sequência antiga de 4 dias, e a atual de 1.
    const out = await new GetStreakUseCase(
      gateway([
        day("2026-08-03"),
        day("2026-08-04"),
        day("2026-08-05"),
        day("2026-08-06"),
        day("2026-09-16"),
      ]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.longestStreak).toBe(4);
    expect(out.currentStreak).toBe(1);
  });

  it("marks the seven days of the current week with their state", async () => {
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-15")]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });

    // Semana de 14 (seg) a 20 (dom).
    expect(out.week.map((d) => d.state)).toEqual([
      "done", // seg 14
      "done", // ter 15
      "today", // qua 16
      "future", // qui 17
      "future", // sex 18
      "closed", // sab 19 — a unidade não abre
      "closed", // dom 20
    ]);
  });

  it("protects a single missed day this week without resetting the streak", async () => {
    // Seg e ter registrados, qua (hoje) registrado, mas… falta um dia no meio.
    // Cenário: seg(14) ok, ter(15) FALTOU, qua(16) ok. O congelamento cobre ter.
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-16")]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });

    expect(out.freezeApplied).toBe(true);
    expect(out.freezesAvailable).toBe(0);
    // O congelamento faz a ponte, mas o dia protegido não é um dia "feito":
    // a ofensiva conta os dias registrados (qua 16 + seg 14) = 2, sem zerar.
    expect(out.currentStreak).toBe(2);
    // O dia coberto aparece como protegido, não como falha.
    expect(out.week.find((d) => d.weekday === 1)?.state).toBe("protected");
  });

  it("has a freeze available when no gap needed covering", async () => {
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-15"), day("2026-09-16")]),
      defaultUnit(),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.freezeApplied).toBe(false);
    expect(out.freezesAvailable).toBe(1);
  });

  it("reads the dates with owner (userId + companyId)", async () => {
    const g = gateway([]);
    await new GetStreakUseCase(g, defaultUnit()).execute({
      ...owner,
      today: WEDNESDAY,
    });
    expect(g.findEntryDates).toHaveBeenCalledWith(owner);
  });

  /**
   * A #77 em uma frase: dia sem janela não conta como falha. Punir alguém por
   * não ter trabalhado no feriado é o oposto do produto — e a pesquisa que
   * embasou a #60 já diz que ofensiva que quebra gera culpa.
   */
  describe("days when the unit does not open", () => {
    it("does not break the streak across a weekend", async () => {
      // Sexta 11, e depois segunda 14 e terça 15. Sábado e domingo no meio
      // nunca foram dias perdidos.
      const out = await new GetStreakUseCase(
        gateway([day("2026-09-11"), day("2026-09-14"), day("2026-09-15")]),
        defaultUnit(),
      ).execute({ ...owner, today: WEDNESDAY });

      expect(out.currentStreak).toBe(3);
      expect(out.freezeApplied).toBe(false);
    });

    it("does not break the streak across a holiday", async () => {
      // 7 de setembro de 2026 cai numa segunda. Registros na sexta 4 e na
      // terça 8: entre eles só há fim de semana e feriado.
      const out = await new GetStreakUseCase(
        gateway([day("2026-09-04"), day("2026-09-08")]),
        unitClosedOn("2026-09-07"),
      ).execute({ ...owner, today: day("2026-09-08") });

      expect(out.currentStreak).toBe(2);
      expect(out.freezeApplied).toBe(false);
    });

    it("spends no freeze on a holiday, keeping it for a real gap", async () => {
      // Feriado na segunda 7 e falta de verdade na quarta 9. A proteção cobre
      // a quarta; o feriado não custou nada.
      const out = await new GetStreakUseCase(
        gateway([day("2026-09-08"), day("2026-09-10")]),
        unitClosedOn("2026-09-07"),
      ).execute({ ...owner, today: day("2026-09-10") });

      expect(out.currentStreak).toBe(2);
      expect(out.freezeApplied).toBe(true);
      expect(out.week.find((d) => d.weekday === 2)?.state).toBe("protected");
    });

    it("shows a holiday as closed, never as missed", async () => {
      const out = await new GetStreakUseCase(
        gateway([day("2026-09-08")]),
        unitClosedOn("2026-09-07"),
      ).execute({ ...owner, today: day("2026-09-08") });

      expect(out.week.find((d) => d.weekday === 0)?.state).toBe("closed");
    });

    it("counts a personal record across closed days", async () => {
      // Quatro registros seguidos em dias úteis, com o fim de semana no meio.
      // A sequência é de 4, não de 2 e 2.
      const out = await new GetStreakUseCase(
        gateway([
          day("2026-09-03"),
          day("2026-09-04"),
          day("2026-09-08"),
          day("2026-09-09"),
        ]),
        unitClosedOn("2026-09-07"),
      ).execute({ ...owner, today: day("2026-09-09") });

      expect(out.longestStreak).toBe(4);
    });
  });
});
