import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface RecordMoodUseCaseInputDto {
  userId: string;
  companyId: string;
  entryDate: Date;
  mood: number;
}

export interface RecordMoodUseCaseOutputDto {
  entryDate: Date;
  mood: number;
}

export type RecordMoodUseCaseInterface = BaseUseCase<
  RecordMoodUseCaseInputDto,
  RecordMoodUseCaseOutputDto
>;
