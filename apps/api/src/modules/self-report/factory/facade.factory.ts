import prisma from "@/infra/database/prisma.instance";
import SelfReportRepository from "../repository/self-report.repository";
import GetSelfReportSummaryUseCase from "../usecase/get-summary/get-summary.usecase";
import RecordSelfReportUseCase from "../usecase/record-self-report/record-self-report.usecase";
import SelfReportFacade from "../facade/self-report.facade";

export default class SelfReportFacadeFactory {
  static create(): SelfReportFacade {
    const selfReportRepository = new SelfReportRepository(prisma);
    return new SelfReportFacade(
      new RecordSelfReportUseCase(selfReportRepository),
      new GetSelfReportSummaryUseCase(selfReportRepository),
    );
  }
}
