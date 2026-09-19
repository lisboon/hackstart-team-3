import { normalizeToMonthStart } from "@/modules/@shared/domain/utils/month";
import { SelfReport } from "../../domain/self-report.entity";
import { SelfReportGateway } from "../../gateway/self-report.gateway";
import {
  RecordSelfReportUseCaseInputDto,
  RecordSelfReportUseCaseInterface,
  RecordSelfReportUseCaseOutputDto,
} from "./record-self-report.usecase.dto";

export default class RecordSelfReportUseCase implements RecordSelfReportUseCaseInterface {
  constructor(private readonly selfReportGateway: SelfReportGateway) {}

  async execute(
    data: RecordSelfReportUseCaseInputDto,
  ): Promise<RecordSelfReportUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const referenceMonth = normalizeToMonthStart(data.referenceMonth);
    const existing = await this.selfReportGateway.findByMonth(
      owner,
      referenceMonth,
    );

    // Declarar de novo no mesmo mês é correção, não um segundo registro: a
    // pessoa pode ter respondido antes de o mês fechar de verdade.
    if (existing) {
      existing.changeSituation(data.situation);
      await this.selfReportGateway.update(existing);
      return {
        referenceMonth: existing.referenceMonth,
        situation: existing.situation,
      };
    }

    const selfReport = SelfReport.create({
      ...owner,
      referenceMonth,
      situation: data.situation,
    });
    await this.selfReportGateway.create(selfReport);

    return {
      referenceMonth: selfReport.referenceMonth,
      situation: selfReport.situation,
    };
  }
}
