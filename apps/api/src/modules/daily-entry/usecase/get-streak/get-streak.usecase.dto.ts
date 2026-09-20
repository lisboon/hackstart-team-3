import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

/**
 * O estado de cada um dos sete dias da semana no cartão de Colheita.
 *
 * `closed` é o dia em que a unidade não abriu — fim de semana, feriado,
 * recesso. Ele não é `missed`: não houve nada a fazer, então não há nada a
 * cobrar (#77).
 */
export type WeekDayState =
  "done" | "today" | "future" | "missed" | "protected" | "closed";

export interface WeekDayView {
  /** Data do dia (primeiro instante do dia, UTC). */
  date: Date;
  /** 0 = segunda … 6 = domingo. */
  weekday: number;
  state: WeekDayState;
}

export interface GetStreakUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

/**
 * A ofensiva da pessoa, contra o próprio passado. Nada aqui é comparado com
 * outras pessoas nem vai ao painel do gestor.
 */
export interface GetStreakUseCaseOutputDto {
  /** Dias seguidos até hoje (ou até ontem, se hoje ainda não foi registrado). */
  currentStreak: number;
  /** Maior sequência já alcançada — recorde pessoal (#75). */
  longestStreak: number;
  /** Os sete dias da semana corrente, de segunda a domingo. */
  week: WeekDayView[];
  /** Congelamentos disponíveis nesta semana (proteção da ofensiva, #74). */
  freezesAvailable: number;
  /** Se um dia da ofensiva atual está sendo protegido por congelamento. */
  freezeApplied: boolean;
}

export type GetStreakUseCaseInterface = BaseUseCase<
  GetStreakUseCaseInputDto,
  GetStreakUseCaseOutputDto
>;
