import prisma from "@/infra/database/prisma.instance";
import ContentPieceRepository from "@/modules/content-piece/repository/content-piece.repository";
import DailyEntryRepository from "../repository/daily-entry.repository";
import AnswerPieceUseCase from "../usecase/answer-piece/answer-piece.usecase";
import GetTodayEntryUseCase from "../usecase/get-today/get-today.usecase";
import RecordMoodUseCase from "../usecase/record-mood/record-mood.usecase";
import DailyEntryFacade from "../facade/daily-entry.facade";

export default class DailyEntryFacadeFactory {
  static create(): DailyEntryFacade {
    const dailyEntryRepository = new DailyEntryRepository(prisma);
    const contentPieceRepository = new ContentPieceRepository(prisma);
    return new DailyEntryFacade(
      new RecordMoodUseCase(dailyEntryRepository),
      new GetTodayEntryUseCase(dailyEntryRepository, contentPieceRepository),
      new AnswerPieceUseCase(dailyEntryRepository, contentPieceRepository),
    );
  }
}
