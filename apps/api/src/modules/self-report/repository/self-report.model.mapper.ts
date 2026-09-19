import type { SelfReport as SelfReportModel } from "@prisma/client";
import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import { SelfReport } from "../domain/self-report.entity";

export class SelfReportModelMapper {
  static toEntity(data: SelfReportModel): SelfReport {
    return new SelfReport({
      id: data.id,
      userId: data.userId,
      companyId: data.companyId,
      referenceMonth: data.referenceMonth,
      situation: data.situation as SelfReportSituation,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }
}
