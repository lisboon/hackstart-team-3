import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import {
  SavingsGoalKind,
  SavingsGoalStatus,
} from "@/modules/@shared/domain/enums";

/**
 * Uma meta com o progresso já derivado das declarações mensais. Sem cifra:
 * `monthsMet`/`targetMonths` contam meses, nunca dinheiro.
 */
export interface GoalView {
  id: string;
  kind: SavingsGoalKind;
  status: SavingsGoalStatus;
  startMonth: Date;
  /** Valor-alvo total autodeclarado, em centavos. */
  targetAmountCents: number;
  /** Alvo por mês, em centavos: total ÷ meses no duradouro; o total no mensal. */
  monthlyTargetCents: number;
  /** Total de meses do prazo: 1 para MONTHLY, N para ENDURING. */
  targetMonths: number;
  /** Meses do prazo já cumpridos (SURPLUS ou BREAK_EVEN). */
  monthsMet: number;
  /** Se o mês corrente, dentro do prazo, já foi cumprido. */
  currentMonthMet: boolean;
  /**
   * Se o prazo terminou (todos os meses já passaram) sem a meta ser cumprida.
   * É o gatilho da tela acolhedora de fim de prazo.
   */
  termEndedUnmet: boolean;
}

export interface GetGoalsUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

export interface GetGoalsUseCaseOutputDto {
  goals: GoalView[];
}

export type GetGoalsUseCaseInterface = BaseUseCase<
  GetGoalsUseCaseInputDto,
  GetGoalsUseCaseOutputDto
>;
