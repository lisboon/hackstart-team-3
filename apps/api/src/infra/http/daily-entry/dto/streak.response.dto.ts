export class StreakWeekDayResponseDto {
  /** Início do dia em UTC. */
  date: Date;
  /** 0 = segunda … 6 = domingo. */
  weekday: number;
  /** done · today · future · missed · protected */
  state: "done" | "today" | "future" | "missed" | "protected";
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
