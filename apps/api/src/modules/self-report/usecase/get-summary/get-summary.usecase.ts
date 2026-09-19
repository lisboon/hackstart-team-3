import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import {
  addMonths,
  normalizeToMonthStart,
} from "@/modules/@shared/domain/utils/month";
import { SelfReport } from "../../domain/self-report.entity";
import { SelfReportGateway } from "../../gateway/self-report.gateway";
import {
  GetSelfReportSummaryUseCaseInputDto,
  GetSelfReportSummaryUseCaseInterface,
  GetSelfReportSummaryUseCaseOutputDto,
} from "./get-summary.usecase.dto";

const WINDOW_IN_MONTHS = 3;

export default class GetSelfReportSummaryUseCase implements GetSelfReportSummaryUseCaseInterface {
  constructor(private readonly selfReportGateway: SelfReportGateway) {}

  async execute(
    data: GetSelfReportSummaryUseCaseInputDto,
  ): Promise<GetSelfReportSummaryUseCaseOutputDto> {
    const currentMonth = normalizeToMonthStart(data.today);
    const windowStart = addMonths(currentMonth, -(WINDOW_IN_MONTHS * 2 - 1));

    const reports = await this.selfReportGateway.findSince(
      { userId: data.userId, companyId: data.companyId },
      windowStart,
    );

    const previousWindowStart = addMonths(
      currentMonth,
      -(WINDOW_IN_MONTHS - 1),
    );
    const recent = reports.filter(
      (report) => report.referenceMonth >= previousWindowStart,
    );
    const previous = reports.filter(
      (report) => report.referenceMonth < previousWindowStart,
    );

    return {
      currentMonth,
      currentSituation: this.situationOf(reports, currentMonth),
      recentAverage: this.averageScore(recent),
      previousAverage: this.averageScore(previous),
      declaredMonths: reports.length,
    };
  }

  private situationOf(
    reports: SelfReport[],
    month: Date,
  ): SelfReportSituation | null {
    const report = reports.find(
      (candidate) => candidate.referenceMonth.getTime() === month.getTime(),
    );
    return report?.situation ?? null;
  }

  /**
   * Devolve null com janela vazia em vez de zero: zero é "faltou bastante", e
   * apresentar ausência de dado como o pior resultado possível seria mentir
   * para a pessoa justamente sobre o que ela não declarou.
   */
  private averageScore(reports: SelfReport[]): number | null {
    if (reports.length === 0) return null;

    const total = reports.reduce((sum, report) => sum + report.score, 0);
    return total / reports.length;
  }
}
