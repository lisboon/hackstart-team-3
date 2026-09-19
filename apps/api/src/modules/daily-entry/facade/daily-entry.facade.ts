import { AnswerPieceUseCaseInterface } from "../usecase/answer-piece/answer-piece.usecase.dto";
import { GetTodayEntryUseCaseInterface } from "../usecase/get-today/get-today.usecase.dto";
import { GetTrackUseCaseInterface } from "../usecase/get-track/get-track.usecase.dto";
import { RecordMoodUseCaseInterface } from "../usecase/record-mood/record-mood.usecase.dto";
import {
  DailyEntryFacadeInterface,
  AnswerPieceFacadeInputDto,
  AnswerPieceFacadeOutputDto,
  GetTodayEntryFacadeInputDto,
  GetTodayEntryFacadeOutputDto,
  RecordMoodFacadeInputDto,
  RecordMoodFacadeOutputDto,
  GetTrackFacadeInputDto,
  GetTrackFacadeOutputDto,
} from "./daily-entry.facade.dto";

export default class DailyEntryFacade implements DailyEntryFacadeInterface {
  constructor(
    private readonly recordMoodUseCase: RecordMoodUseCaseInterface,
    private readonly getTodayUseCase: GetTodayEntryUseCaseInterface,
    private readonly answerPieceUseCase: AnswerPieceUseCaseInterface,
    private readonly getTrackUseCase: GetTrackUseCaseInterface,
  ) {}

  async recordMood(
    data: RecordMoodFacadeInputDto,
  ): Promise<RecordMoodFacadeOutputDto> {
    return this.recordMoodUseCase.execute(data);
  }

  async getToday(
    data: GetTodayEntryFacadeInputDto,
  ): Promise<GetTodayEntryFacadeOutputDto> {
    return this.getTodayUseCase.execute(data);
  }

  async answerPiece(
    data: AnswerPieceFacadeInputDto,
  ): Promise<AnswerPieceFacadeOutputDto> {
    return this.answerPieceUseCase.execute(data);
  }

  async getTrack(
    data: GetTrackFacadeInputDto,
  ): Promise<GetTrackFacadeOutputDto> {
    return this.getTrackUseCase.execute(data);
  }
}
