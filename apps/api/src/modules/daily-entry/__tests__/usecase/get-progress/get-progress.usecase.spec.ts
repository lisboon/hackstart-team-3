import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetProgressUseCase from "../../../usecase/get-progress/get-progress.usecase";

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

const SEPTEMBER = day("2026-09-19");

describe("GetProgressUseCase", () => {
  it("reports the days of the current month that have an entry", async () => {
    const out = await new GetProgressUseCase(
      gateway([day("2026-09-01"), day("2026-09-05"), day("2026-09-19")]),
    ).execute({ ...owner, today: SEPTEMBER });

    expect(out.month.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(out.days).toEqual([1, 5, 19]);
    expect(out.total).toBe(3);
  });

  it("leaves out the months around it", async () => {
    const out = await new GetProgressUseCase(
      gateway([day("2026-08-31"), day("2026-09-10"), day("2026-10-01")]),
    ).execute({ ...owner, today: SEPTEMBER });

    expect(out.days).toEqual([10]);
  });

  it("returns an empty month without calling it a failure", async () => {
    // Mês sem registro é ausência de dado. Nenhum campo conta faltas, e não
    // existe nada aqui para a tela pintar de vermelho.
    const out = await new GetProgressUseCase(gateway([])).execute({
      ...owner,
      today: SEPTEMBER,
    });

    expect(out.days).toEqual([]);
    expect(out.total).toBe(0);
    expect(out.daysInMonth).toBe(30);
  });

  it("counts the days of the month, leap year included", async () => {
    const february = await new GetProgressUseCase(gateway([])).execute({
      ...owner,
      today: day("2028-02-10"),
    });
    expect(february.daysInMonth).toBe(29);

    const december = await new GetProgressUseCase(gateway([])).execute({
      ...owner,
      today: day("2026-12-10"),
    });
    expect(december.daysInMonth).toBe(31);
  });

  it("sorts the days and never repeats one", async () => {
    const out = await new GetProgressUseCase(
      gateway([day("2026-09-19"), day("2026-09-02"), day("2026-09-19")]),
    ).execute({ ...owner, today: SEPTEMBER });

    expect(out.days).toEqual([2, 19]);
  });

  it("reads the dates with owner (userId + companyId)", async () => {
    const g = gateway([]);
    await new GetProgressUseCase(g).execute({ ...owner, today: SEPTEMBER });
    expect(g.findEntryDates).toHaveBeenCalledWith(owner);
  });
});
