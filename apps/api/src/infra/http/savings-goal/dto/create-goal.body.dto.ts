import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { SavingsGoalKind } from "@/modules/@shared/domain/enums";
import {
  MAX_TARGET_MONTHS,
  MIN_TARGET_MONTHS,
} from "@/modules/savings-goal/domain/validators/savings-goal.validator";

export class CreateGoalBodyDto {
  /**
   * MONTHLY (o mês) ou ENDURING (N meses). Identidade e mês de início vêm do
   * servidor: a sessão e o relógio dele.
   */
  @IsEnum(SavingsGoalKind, { message: "Invalid kind" })
  kind: SavingsGoalKind;

  /** Valor-alvo autodeclarado, em centavos (> 0). */
  @IsInt({ message: "Invalid targetAmountCents" })
  @Min(1, { message: "Invalid targetAmountCents" })
  targetAmountCents: number;

  /** Obrigatório para ENDURING; proibido para MONTHLY (regra na entidade). */
  @IsOptional()
  @IsInt({ message: "Invalid targetMonths" })
  @Min(MIN_TARGET_MONTHS, { message: "Invalid targetMonths" })
  @Max(MAX_TARGET_MONTHS, { message: "Invalid targetMonths" })
  targetMonths?: number;
}
