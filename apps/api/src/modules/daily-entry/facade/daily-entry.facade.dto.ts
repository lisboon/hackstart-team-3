import {
  GetTrackUseCaseInputDto,
  GetTrackUseCaseOutputDto,
} from "../usecase/get-track/get-track.usecase.dto";
import {
  GetJourneyUseCaseInputDto,
  GetJourneyUseCaseOutputDto,
} from "../usecase/get-journey/get-journey.usecase.dto";
import {
  AnswerPieceUseCaseInputDto,
  AnswerPieceUseCaseOutputDto,
} from "../usecase/answer-piece/answer-piece.usecase.dto";
import {
  GetTodayEntryUseCaseInputDto,
  GetTodayEntryUseCaseOutputDto,
} from "../usecase/get-today/get-today.usecase.dto";
import {
  RecordMoodUseCaseInputDto,
  RecordMoodUseCaseOutputDto,
} from "../usecase/record-mood/record-mood.usecase.dto";

export type RecordMoodFacadeInputDto = RecordMoodUseCaseInputDto;
export type RecordMoodFacadeOutputDto = RecordMoodUseCaseOutputDto;
export type AnswerPieceFacadeInputDto = AnswerPieceUseCaseInputDto;
export type AnswerPieceFacadeOutputDto = AnswerPieceUseCaseOutputDto;

export type GetTodayEntryFacadeInputDto = GetTodayEntryUseCaseInputDto;
export type GetTodayEntryFacadeOutputDto = GetTodayEntryUseCaseOutputDto;

export type GetTrackFacadeInputDto = GetTrackUseCaseInputDto;
export type GetTrackFacadeOutputDto = GetTrackUseCaseOutputDto;

export type GetJourneyFacadeInputDto = GetJourneyUseCaseInputDto;
export type GetJourneyFacadeOutputDto = GetJourneyUseCaseOutputDto;

export interface DailyEntryFacadeInterface {
  recordMood(
    data: RecordMoodFacadeInputDto,
  ): Promise<RecordMoodFacadeOutputDto>;
  getToday(
    data: GetTodayEntryFacadeInputDto,
  ): Promise<GetTodayEntryFacadeOutputDto>;
  answerPiece(
    data: AnswerPieceFacadeInputDto,
  ): Promise<AnswerPieceFacadeOutputDto>;
  getTrack(data: GetTrackFacadeInputDto): Promise<GetTrackFacadeOutputDto>;
  getJourney(
    data: GetJourneyFacadeInputDto,
  ): Promise<GetJourneyFacadeOutputDto>;
}
