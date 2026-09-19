import {
  GetSelfReportSummaryUseCaseInputDto,
  GetSelfReportSummaryUseCaseOutputDto,
} from "../usecase/get-summary/get-summary.usecase.dto";
import {
  RecordSelfReportUseCaseInputDto,
  RecordSelfReportUseCaseOutputDto,
} from "../usecase/record-self-report/record-self-report.usecase.dto";

export type RecordSelfReportFacadeInputDto = RecordSelfReportUseCaseInputDto;
export type RecordSelfReportFacadeOutputDto = RecordSelfReportUseCaseOutputDto;

export type GetSelfReportSummaryFacadeInputDto =
  GetSelfReportSummaryUseCaseInputDto;
export type GetSelfReportSummaryFacadeOutputDto =
  GetSelfReportSummaryUseCaseOutputDto;

export interface SelfReportFacadeInterface {
  record(
    data: RecordSelfReportFacadeInputDto,
  ): Promise<RecordSelfReportFacadeOutputDto>;
  getSummary(
    data: GetSelfReportSummaryFacadeInputDto,
  ): Promise<GetSelfReportSummaryFacadeOutputDto>;
}
