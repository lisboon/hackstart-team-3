import { SelfReportSituation } from "@/modules/@shared/domain/enums";

export class SelfReportResponseDto {
  referenceMonth: Date;
  situation: SelfReportSituation;
}

export class SelfReportSummaryResponseDto {
  currentMonth: Date;
  currentSituation: SelfReportSituation | null;
  recentAverage: number | null;
  previousAverage: number | null;
  declaredMonths: number;
}
