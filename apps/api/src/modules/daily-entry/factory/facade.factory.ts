import prisma from "@/infra/database/prisma.instance";
import ContentPieceRepository from "@/modules/content-piece/repository/content-piece.repository";
import DailyEntryRepository from "../repository/daily-entry.repository";
import AnswerPieceUseCase from "../usecase/answer-piece/answer-piece.usecase";
import GetTodayEntryUseCase from "../usecase/get-today/get-today.usecase";
import GetTrackUseCase from "../usecase/get-track/get-track.usecase";
import GetJourneyUseCase from "../usecase/get-journey/get-journey.usecase";
import GetStreakUseCase from "../usecase/get-streak/get-streak.usecase";
import RecordMoodUseCase from "../usecase/record-mood/record-mood.usecase";
import DailyEntryFacade from "../facade/daily-entry.facade";
import CompanyRepository from "@/modules/company/repository/company.repository";
import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
} from "@/modules/company/domain/journey-window";

export default class DailyEntryFacadeFactory {
  /**
   * `fallbackWindow` é o padrão de quem nunca configurou a janela — a de
   * verdade vem da unidade, lida por requisição (#76).
   */
  static create(
    fallbackWindow: JourneyWindow = DEFAULT_JOURNEY_WINDOW,
  ): DailyEntryFacade {
    const dailyEntryRepository = new DailyEntryRepository(prisma);
    const contentPieceRepository = new ContentPieceRepository(prisma);
    const companyRepository = new CompanyRepository(prisma);
    return new DailyEntryFacade(
      new RecordMoodUseCase(
        dailyEntryRepository,
        companyRepository,
        fallbackWindow,
      ),
      new GetTodayEntryUseCase(
        dailyEntryRepository,
        contentPieceRepository,
        companyRepository,
        fallbackWindow,
      ),
      new AnswerPieceUseCase(
        dailyEntryRepository,
        contentPieceRepository,
        companyRepository,
        fallbackWindow,
      ),
      new GetTrackUseCase(dailyEntryRepository, contentPieceRepository),
      new GetJourneyUseCase(dailyEntryRepository, contentPieceRepository),
      new GetStreakUseCase(dailyEntryRepository),
    );
  }
}
