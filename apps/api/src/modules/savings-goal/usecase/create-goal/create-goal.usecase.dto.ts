import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { SavingsGoalKind } from "@/modules/@shared/domain/enums";

export interface CreateGoalUseCaseInputDto {
  userId: string;
  companyId: string;
  kind: SavingsGoalKind;
  /** Obrigatório para ENDURING; ausente para MONTHLY. */
  targetMonths?: number;
  /** O relógio do servidor decide o mês de início. */
  today: Date;
}

export interface CreateGoalUseCaseOutputDto {
  id: string;
  kind: SavingsGoalKind;
  targetMonths: number | null;
  startMonth: Date;
}

export type CreateGoalUseCaseInterface = BaseUseCase<
  CreateGoalUseCaseInputDto,
  CreateGoalUseCaseOutputDto
>;
