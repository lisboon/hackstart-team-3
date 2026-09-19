import { CoopsStage } from "@/modules/@shared/domain/enums";

export class TrackStageResponseDto {
  stage: CoopsStage;
  total: number;
  answered: number;
}

export class TrackResponseDto {
  stages: TrackStageResponseDto[];
}
