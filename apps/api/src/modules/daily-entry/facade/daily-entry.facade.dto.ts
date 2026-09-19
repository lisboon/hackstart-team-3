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
export type GetTodayEntryFacadeInputDto = GetTodayEntryUseCaseInputDto;
export type GetTodayEntryFacadeOutputDto = GetTodayEntryUseCaseOutputDto;

export interface DailyEntryFacadeInterface {
  recordMood(
    data: RecordMoodFacadeInputDto,
  ): Promise<RecordMoodFacadeOutputDto>;
  getToday(
    data: GetTodayEntryFacadeInputDto,
  ): Promise<GetTodayEntryFacadeOutputDto>;
}
