import { Inject, Injectable } from "@nestjs/common";
import SelfReportFacade from "@/modules/self-report/facade/self-report.facade";
import {
  GetSelfReportSummaryFacadeInputDto,
  RecordSelfReportFacadeInputDto,
} from "@/modules/self-report/facade/self-report.facade.dto";

@Injectable()
export class SelfReportService {
  @Inject(SelfReportFacade)
  private readonly selfReportFacade: SelfReportFacade;

  async record(input: RecordSelfReportFacadeInputDto) {
    return this.selfReportFacade.record(input);
  }

  async getSummary(input: GetSelfReportSummaryFacadeInputDto) {
    return this.selfReportFacade.getSummary(input);
  }
}
