/**
 * O mês da pessoa na tela Progresso. Dia sem registro não vem em `days`, e a
 * tela o desenha vazio: ausência de dado, nunca falha.
 */
export class ProgressResponseDto {
  /** Primeiro dia do mês corrente, em UTC. */
  month: Date;
  daysInMonth: number;
  /** Os dias com registro, de 1 a 31. */
  days: number[];
  total: number;
}
