import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetStreakUseCase from "../../../usecase/get-streak/get-streak.usecase";

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

// Uma quarta-feira, para termos dias antes (seg/ter) e depois (qui..dom).
const WEDNESDAY = day("2026-09-16");

describe("GetStreakUseCase", () => {
  it("returns zero for someone with no entries", async () => {
    const out = await new GetStreakUseCase(gateway([])).execute({
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
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.currentStreak).toBe(3);
  });

  it("keeps the streak when today is not done yet, counting up to yesterday", async () => {
    // Hoje (qua) ainda não registrado; seg e ter sim. O dia corrente está em
    // aberto e não quebra a ofensiva.
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-15")]),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.currentStreak).toBe(2);
    expect(out.week.find((d) => d.weekday === 2)?.state).toBe("today");
  });

  it("reports the personal record as the longest run ever", async () => {
    // Uma sequência antiga de 4 dias, e a atual de 1.
    const out = await new GetStreakUseCase(
      gateway([
        day("2026-08-01"),
        day("2026-08-02"),
        day("2026-08-03"),
        day("2026-08-04"),
        day("2026-09-16"),
      ]),
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.longestStreak).toBe(4);
    expect(out.currentStreak).toBe(1);
  });

  it("marks the seven days of the current week with their state", async () => {
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-15")]),
    ).execute({ ...owner, today: WEDNESDAY });

    // Semana de 14 (seg) a 20 (dom).
    expect(out.week.map((d) => d.state)).toEqual([
      "done", // seg 14
      "done", // ter 15
      "today", // qua 16
      "future", // qui 17
      "future", // sex 18
      "future", // sab 19
      "future", // dom 20
    ]);
  });

  it("protects a single missed day this week without resetting the streak", async () => {
    // Seg e ter registrados, qua (hoje) registrado, mas… falta um dia no meio.
    // Cenário: seg(14) ok, ter(15) FALTOU, qua(16) ok. O congelamento cobre ter.
    const out = await new GetStreakUseCase(
      gateway([day("2026-09-14"), day("2026-09-16")]),
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
    ).execute({ ...owner, today: WEDNESDAY });
    expect(out.freezeApplied).toBe(false);
    expect(out.freezesAvailable).toBe(1);
  });

  it("reads the dates with owner (userId + companyId)", async () => {
    const g = gateway([]);
    await new GetStreakUseCase(g).execute({ ...owner, today: WEDNESDAY });
    expect(g.findEntryDates).toHaveBeenCalledWith(owner);
  });
});
