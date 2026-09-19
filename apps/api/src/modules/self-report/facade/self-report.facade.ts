import { GetSelfReportSummaryUseCaseInterface } from "../usecase/get-summary/get-summary.usecase.dto";
import { RecordSelfReportUseCaseInterface } from "../usecase/record-self-report/record-self-report.usecase.dto";
import {
  GetSelfReportSummaryFacadeInputDto,
  GetSelfReportSummaryFacadeOutputDto,
  RecordSelfReportFacadeInputDto,
  RecordSelfReportFacadeOutputDto,
  SelfReportFacadeInterface,
} from "./self-report.facade.dto";

export default class SelfReportFacade implements SelfReportFacadeInterface {
  constructor(
    private readonly recordSelfReportUseCase: RecordSelfReportUseCaseInterface,
    private readonly getSummaryUseCase: GetSelfReportSummaryUseCaseInterface,
  ) {}

  async record(
    data: RecordSelfReportFacadeInputDto,
  ): Promise<RecordSelfReportFacadeOutputDto> {
    return this.recordSelfReportUseCase.execute(data);
  }

  async getSummary(
    data: GetSelfReportSummaryFacadeInputDto,
  ): Promise<GetSelfReportSummaryFacadeOutputDto> {
    return this.getSummaryUseCase.execute(data);
  }
}
