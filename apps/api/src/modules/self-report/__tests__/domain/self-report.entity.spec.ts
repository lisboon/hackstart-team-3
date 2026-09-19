import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { SelfReport } from "../../domain/self-report.entity";

const validProps = {
  userId: "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e",
  companyId: "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f",
  referenceMonth: new Date(Date.UTC(2026, 8, 19)),
  situation: SelfReportSituation.SURPLUS,
};

describe("SelfReport entity", () => {
  it("normalizes any day of the month to the first day in UTC", () => {
    const selfReport = SelfReport.create(validProps);

    expect(selfReport.referenceMonth.toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });

  it("scores the declaration as an ordinal scale", () => {
    const cases: Array<[SelfReportSituation, number]> = [
      [SelfReportSituation.SURPLUS, 3],
      [SelfReportSituation.BREAK_EVEN, 2],
      [SelfReportSituation.SLIGHT_SHORTFALL, 1],
      [SelfReportSituation.SEVERE_SHORTFALL, 0],
    ];

    for (const [situation, expected] of cases) {
      expect(SelfReport.create({ ...validProps, situation }).score).toBe(
        expected,
      );
    }
  });

  it("lets the person correct the declaration within the month", () => {
    const selfReport = SelfReport.create(validProps);

    selfReport.changeSituation(SelfReportSituation.SLIGHT_SHORTFALL);

    expect(selfReport.situation).toBe(SelfReportSituation.SLIGHT_SHORTFALL);
  });

  it("rejects an owner that is not a uuid", () => {
    expect(() => SelfReport.create({ ...validProps, userId: "nope" })).toThrow(
      EntityValidationError,
    );
  });

  it("rejects a situation outside the declared scale", () => {
    expect(() =>
      SelfReport.create({
        ...validProps,
        situation: "SOMEWHAT" as SelfReportSituation,
      }),
    ).toThrow(EntityValidationError);
  });
});
