export class StreakWeekDayResponseDto {
  /** Início do dia em UTC. */
  date: Date;
  /** 0 = segunda … 6 = domingo. */
  weekday: number;
  /**
   * done · today · future · missed · protected · closed
   *
   * `closed` é o dia em que a unidade não abriu — fim de semana, feriado,
   * recesso. Não é falta: não havia diária a fazer.
   */
  state: "done" | "today" | "future" | "missed" | "protected" | "closed";
}

/**
 * A ofensiva da pessoa, contra o próprio passado. `longestStreak` é recorde
 * pessoal, nunca comparação. A proteção (congelamento) evita que um dia perdido
 * zere a sequência. Nada aqui vai ao painel do gestor.
 */
export class StreakResponseDto {
  currentStreak: number;
  longestStreak: number;
  week: StreakWeekDayResponseDto[];
  freezesAvailable: number;
  freezeApplied: boolean;
}
