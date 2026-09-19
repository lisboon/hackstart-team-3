import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import { SelfReport } from "../../../domain/self-report.entity";
import { SelfReportGateway } from "../../../gateway/self-report.gateway";
import GetSelfReportSummaryUseCase from "../../../usecase/get-summary/get-summary.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const today = new Date(Date.UTC(2026, 8, 19));

const reportFor = (monthOffset: number, situation: SelfReportSituation) =>
  SelfReport.create({
    userId,
    companyId,
    referenceMonth: new Date(Date.UTC(2026, 8 + monthOffset, 1)),
    situation,
  });

const gatewayReturning = (reports: SelfReport[]): SelfReportGateway => ({
  findByMonth: jest.fn(),
  findSince: jest.fn().mockResolvedValue(reports),
  create: jest.fn(),
  update: jest.fn(),
});

describe("GetSelfReportSummaryUseCase", () => {
  it("averages the last three months against the three before them", async () => {
    const gateway = gatewayReturning([
      reportFor(0, SelfReportSituation.SURPLUS),
      reportFor(-1, SelfReportSituation.SURPLUS),
      reportFor(-2, SelfReportSituation.BREAK_EVEN),
      reportFor(-3, SelfReportSituation.SEVERE_SHORTFALL),
      reportFor(-4, SelfReportSituation.SLIGHT_SHORTFALL),
      reportFor(-5, SelfReportSituation.SEVERE_SHORTFALL),
    ]);

    const output = await new GetSelfReportSummaryUseCase(gateway).execute({
      userId,
      companyId,
      today,
    });

    expect(output.recentAverage).toBeCloseTo((3 + 3 + 2) / 3);
    expect(output.previousAverage).toBeCloseTo((0 + 1 + 0) / 3);
    expect(output.declaredMonths).toBe(6);
  });

  it("reads the current month situation from the window", async () => {
    const gateway = gatewayReturning([
      reportFor(0, SelfReportSituation.SLIGHT_SHORTFALL),
    ]);

    const output = await new GetSelfReportSummaryUseCase(gateway).execute({
      userId,
      companyId,
      today,
    });

    expect(output.currentSituation).toBe(SelfReportSituation.SLIGHT_SHORTFALL);
    expect(output.currentMonth.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("returns null instead of zero when a window has no declaration", async () => {
    const gateway = gatewayReturning([
      reportFor(0, SelfReportSituation.SURPLUS),
    ]);

    const output = await new GetSelfReportSummaryUseCase(gateway).execute({
      userId,
      companyId,
      today,
    });

    // Zero significa "faltou bastante". Ausência de dado não pode ser
    // apresentada como o pior resultado possível.
    expect(output.previousAverage).toBeNull();
    expect(output.recentAverage).toBe(3);
  });

  it("asks the gateway for the owner, never for the user alone", async () => {
    const gateway = gatewayReturning([]);

    await new GetSelfReportSummaryUseCase(gateway).execute({
      userId,
      companyId,
      today,
    });

    expect(gateway.findSince).toHaveBeenCalledWith(
      { userId, companyId },
      expect.any(Date),
    );
  });
});
