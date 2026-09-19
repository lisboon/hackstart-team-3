import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { SelfReportSituation } from "@/modules/@shared/domain/enums";

export interface RecordSelfReportUseCaseInputDto {
  userId: string;
  companyId: string;
  referenceMonth: Date;
  situation: SelfReportSituation;
}

export interface RecordSelfReportUseCaseOutputDto {
  referenceMonth: Date;
  situation: SelfReportSituation;
}

export type RecordSelfReportUseCaseInterface = BaseUseCase<
  RecordSelfReportUseCaseInputDto,
  RecordSelfReportUseCaseOutputDto
>;
