import { Module } from "@nestjs/common";
import SelfReportFacade from "@/modules/self-report/facade/self-report.facade";
import SelfReportFacadeFactory from "@/modules/self-report/factory/facade.factory";
import { AuthModule } from "../auth/auth.module";
import { SelfReportController } from "./self-report.controller";
import { SelfReportService } from "./self-report.service";

@Module({
  imports: [AuthModule],
  controllers: [SelfReportController],
  providers: [
    SelfReportService,
    {
      provide: SelfReportFacade,
      useFactory: () => SelfReportFacadeFactory.create(),
    },
  ],
  exports: [SelfReportService],
})
export class SelfReportModule {}
