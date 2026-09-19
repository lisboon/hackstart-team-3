import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import { SelfReport } from "../../../domain/self-report.entity";
import { SelfReportGateway } from "../../../gateway/self-report.gateway";
import RecordSelfReportUseCase from "../../../usecase/record-self-report/record-self-report.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const anyDayOfSeptember = new Date(Date.UTC(2026, 8, 19));

const gatewayWith = (existing: SelfReport | null): SelfReportGateway => ({
  findByMonth: jest.fn().mockResolvedValue(existing),
  findSince: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

describe("RecordSelfReportUseCase", () => {
  it("creates the declaration for the normalized month", async () => {
    const gateway = gatewayWith(null);

    const output = await new RecordSelfReportUseCase(gateway).execute({
      userId,
      companyId,
      referenceMonth: anyDayOfSeptember,
      situation: SelfReportSituation.SURPLUS,
    });

    expect(gateway.create).toHaveBeenCalledTimes(1);
    expect(output.referenceMonth.toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });

  it("corrects the existing declaration instead of creating a second one", async () => {
    const existing = SelfReport.create({
      userId,
      companyId,
      referenceMonth: anyDayOfSeptember,
      situation: SelfReportSituation.SEVERE_SHORTFALL,
    });
    const gateway = gatewayWith(existing);

    const output = await new RecordSelfReportUseCase(gateway).execute({
      userId,
      companyId,
      referenceMonth: anyDayOfSeptember,
      situation: SelfReportSituation.SURPLUS,
    });

    expect(gateway.create).not.toHaveBeenCalled();
    expect(gateway.update).toHaveBeenCalledWith(existing);
    expect(output.situation).toBe(SelfReportSituation.SURPLUS);
  });

  it("looks the month up by owner, never by user alone", async () => {
    const gateway = gatewayWith(null);

    await new RecordSelfReportUseCase(gateway).execute({
      userId,
      companyId,
      referenceMonth: anyDayOfSeptember,
      situation: SelfReportSituation.SURPLUS,
    });

    expect(gateway.findByMonth).toHaveBeenCalledWith(
      { userId, companyId },
      new Date(Date.UTC(2026, 8, 1)),
    );
  });
});
