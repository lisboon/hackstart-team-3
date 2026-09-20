import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { SavingsGoalUnmetReason } from "@/modules/@shared/domain/enums";
import {
  MAX_TARGET_MONTHS,
  MIN_TARGET_MONTHS,
} from "@/modules/savings-goal/domain/validators/savings-goal.validator";

/** O que a pessoa faz no fim do prazo: estender ou encerrar. */
export enum UpdateGoalAction {
  EXTEND = "EXTEND",
  END = "END",
}

export class UpdateGoalBodyDto {
  @IsEnum(UpdateGoalAction, { message: "Invalid action" })
  action: UpdateGoalAction;

  /** Novo prazo, obrigatório ao estender (validado no fluxo/entidade). */
  @IsOptional()
  @IsInt({ message: "Invalid targetMonths" })
  @Min(MIN_TARGET_MONTHS, { message: "Invalid targetMonths" })
  @Max(MAX_TARGET_MONTHS, { message: "Invalid targetMonths" })
  targetMonths?: number;

  /** Motivo opcional ao encerrar, em opção fechada. Nunca texto livre. */
  @IsOptional()
  @IsEnum(SavingsGoalUnmetReason, { message: "Invalid unmetReason" })
  unmetReason?: SavingsGoalUnmetReason;
}
