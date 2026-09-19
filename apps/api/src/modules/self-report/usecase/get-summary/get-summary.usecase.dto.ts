import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { SelfReportSituation } from "@/modules/@shared/domain/enums";

export interface GetSelfReportSummaryUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

export interface GetSelfReportSummaryUseCaseOutputDto {
  currentMonth: Date;
  currentSituation: SelfReportSituation | null;
  recentAverage: number | null;
  previousAverage: number | null;
  declaredMonths: number;
}

export type GetSelfReportSummaryUseCaseInterface = BaseUseCase<
  GetSelfReportSummaryUseCaseInputDto,
  GetSelfReportSummaryUseCaseOutputDto
>;
