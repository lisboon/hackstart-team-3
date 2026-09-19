import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { CoopsStage } from "@/modules/@shared/domain/enums";

export interface TrackStageDto {
  stage: CoopsStage;
  total: number;
  answered: number;
}

export interface GetTrackUseCaseInputDto {
  userId: string;
  companyId: string;
}

/**
 * As cinco etapas vêm sempre, na ordem do método, mesmo as que ainda não têm
 * peça ou resposta. A trilha mostra o caminho inteiro: some uma etapa e a
 * pessoa deixa de saber que ela existe.
 */
export interface GetTrackUseCaseOutputDto {
  stages: TrackStageDto[];
}

export type GetTrackUseCaseInterface = BaseUseCase<
  GetTrackUseCaseInputDto,
  GetTrackUseCaseOutputDto
>;
