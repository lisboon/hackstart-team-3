import prisma from "@/infra/database/prisma.instance";
import DailyEntryRepository from "../repository/daily-entry.repository";
import GetTodayEntryUseCase from "../usecase/get-today/get-today.usecase";
import RecordMoodUseCase from "../usecase/record-mood/record-mood.usecase";
import DailyEntryFacade from "../facade/daily-entry.facade";

export default class DailyEntryFacadeFactory {
  static create(): DailyEntryFacade {
    const dailyEntryRepository = new DailyEntryRepository(prisma);
    return new DailyEntryFacade(
      new RecordMoodUseCase(dailyEntryRepository),
      new GetTodayEntryUseCase(dailyEntryRepository),
    );
  }
}
