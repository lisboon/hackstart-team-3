import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface GetTodayEntryUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

export interface GetTodayEntryUseCaseOutputDto {
  entryDate: Date;
  answered: boolean;
  mood: number | null;
}

export type GetTodayEntryUseCaseInterface = BaseUseCase<
  GetTodayEntryUseCaseInputDto,
  GetTodayEntryUseCaseOutputDto
>;
