import { Module } from "@nestjs/common";
import { loadApplicationConfig } from "@/infra/config/application.config";
import DailyEntryFacade from "@/modules/daily-entry/facade/daily-entry.facade";
import DailyEntryFacadeFactory from "@/modules/daily-entry/factory/facade.factory";
import { AuthModule } from "../auth/auth.module";
import { DailyEntryController } from "./daily-entry.controller";
import { DailyEntryService } from "./daily-entry.service";

const config = loadApplicationConfig();

@Module({
  imports: [AuthModule],
  controllers: [DailyEntryController],
  providers: [
    DailyEntryService,
    {
      provide: DailyEntryFacade,
      useFactory: () => DailyEntryFacadeFactory.create(config.journeyWindow),
    },
  ],
  exports: [DailyEntryService],
})
export class DailyEntryModule {}
