import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { SavingsGoalKind } from "@/modules/@shared/domain/enums";

export interface CreateGoalUseCaseInputDto {
  userId: string;
  companyId: string;
  kind: SavingsGoalKind;
  /** Valor-alvo autodeclarado, em centavos. */
  targetAmountCents: number;
  /** Obrigatório para ENDURING; ausente para MONTHLY. */
  targetMonths?: number;
  /** O relógio do servidor decide o mês de início. */
  today: Date;
}

export interface CreateGoalUseCaseOutputDto {
  id: string;
  kind: SavingsGoalKind;
  targetAmountCents: number;
  targetMonths: number | null;
  startMonth: Date;
}

export type CreateGoalUseCaseInterface = BaseUseCase<
  CreateGoalUseCaseInputDto,
  CreateGoalUseCaseOutputDto
>;
