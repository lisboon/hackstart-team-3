import {
  SavingsGoalKind,
  SavingsGoalStatus,
} from "@/modules/@shared/domain/enums";

export class CreateGoalResponseDto {
  id: string;
  kind: SavingsGoalKind;
  targetMonths: number | null;
  startMonth: Date;
}

/**
 * A meta com o progresso já derivado das declarações mensais. Sem cifra:
 * tudo aqui conta meses, nunca dinheiro.
 */
export class GoalResponseDto {
  id: string;
  kind: SavingsGoalKind;
  status: SavingsGoalStatus;
  startMonth: Date;
  /** 1 para MONTHLY, N para ENDURING. */
  targetMonths: number;
  /** Meses do prazo já cumpridos (sobrou ou deu exato). */
  monthsMet: number;
  /** Se o mês corrente, dentro do prazo, já foi cumprido. */
  currentMonthMet: boolean;
  /** Se o prazo terminou sem cumprir — gatilho da tela acolhedora. */
  termEndedUnmet: boolean;
}

export class GoalsResponseDto {
  goals: GoalResponseDto[];
}

export class UpdateGoalResponseDto {
  id: string;
  status: SavingsGoalStatus;
  targetMonths: number | null;
}
