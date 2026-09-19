import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { CoopsStage } from "@/modules/@shared/domain/enums";

export interface TodayPieceDto {
  id: string;
  stage: CoopsStage;
  title: string;
  body: string;
  prompt: string;
  options: { label: string }[];
  sourceUrl: string;
}

export interface GetTodayEntryUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

export interface GetTodayEntryUseCaseOutputDto {
  entryDate: Date;
  answered: boolean;
  mood: number | null;
  pieceAnswered: boolean;
  piece: TodayPieceDto | null;
}

export type GetTodayEntryUseCaseInterface = BaseUseCase<
  GetTodayEntryUseCaseInputDto,
  GetTodayEntryUseCaseOutputDto
>;
