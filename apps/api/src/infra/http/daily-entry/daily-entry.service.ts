import { Inject, Injectable } from "@nestjs/common";
import DailyEntryFacade from "@/modules/daily-entry/facade/daily-entry.facade";
import {
  AnswerPieceFacadeInputDto,
  GetTodayEntryFacadeInputDto,
  GetTrackFacadeInputDto,
  RecordMoodFacadeInputDto,
} from "@/modules/daily-entry/facade/daily-entry.facade.dto";

@Injectable()
export class DailyEntryService {
  @Inject(DailyEntryFacade)
  private readonly dailyEntryFacade: DailyEntryFacade;

  async recordMood(input: RecordMoodFacadeInputDto) {
    return this.dailyEntryFacade.recordMood(input);
  }

  async getToday(input: GetTodayEntryFacadeInputDto) {
    return this.dailyEntryFacade.getToday(input);
  }

  async answerPiece(input: AnswerPieceFacadeInputDto) {
    return this.dailyEntryFacade.answerPiece(input);
  }

  async getTrack(input: GetTrackFacadeInputDto) {
    return this.dailyEntryFacade.getTrack(input);
  }
}
