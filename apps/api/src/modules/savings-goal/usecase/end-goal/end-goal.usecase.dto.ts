import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { SavingsGoalUnmetReason } from "@/modules/@shared/domain/enums";

export interface EndGoalUseCaseInputDto {
  userId: string;
  companyId: string;
  id: string;
  /** Motivo opcional, em opção fechada. Privado, nunca sai do recurso pessoal. */
  unmetReason?: SavingsGoalUnmetReason;
}

export interface EndGoalUseCaseOutputDto {
  id: string;
  status: string;
}

export type EndGoalUseCaseInterface = BaseUseCase<
  EndGoalUseCaseInputDto,
  EndGoalUseCaseOutputDto
>;
