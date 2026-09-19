import { AnswerPieceUseCaseInterface } from "../usecase/answer-piece/answer-piece.usecase.dto";
import { GetTodayEntryUseCaseInterface } from "../usecase/get-today/get-today.usecase.dto";
import { RecordMoodUseCaseInterface } from "../usecase/record-mood/record-mood.usecase.dto";
import {
  DailyEntryFacadeInterface,
  AnswerPieceFacadeInputDto,
  AnswerPieceFacadeOutputDto,
  GetTodayEntryFacadeInputDto,
  GetTodayEntryFacadeOutputDto,
  RecordMoodFacadeInputDto,
  RecordMoodFacadeOutputDto,
} from "./daily-entry.facade.dto";

export default class DailyEntryFacade implements DailyEntryFacadeInterface {
  constructor(
    private readonly recordMoodUseCase: RecordMoodUseCaseInterface,
    private readonly getTodayUseCase: GetTodayEntryUseCaseInterface,
    private readonly answerPieceUseCase: AnswerPieceUseCaseInterface,
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
}
