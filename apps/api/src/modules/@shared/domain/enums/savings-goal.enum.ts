/**
 * Dois horizontes de meta de guarda, escolhidos pela pessoa. Nenhum deles
 * carrega valor em dinheiro: a meta é sobre o hábito de guardar, não sobre
 * quanto se guardou.
 */
export enum SavingsGoalKind {
  MONTHLY = "MONTHLY",
  ENDURING = "ENDURING",
}

/**
 * O estado da meta. `MET` é cumprida (o mês, ou os N meses, fecharam no azul);
 * `ENDED` é encerrada pela pessoa. Falha não é um estado: um mês que não deu
 * não muda o status — a meta espera até o fim do prazo.
 */
export enum SavingsGoalStatus {
  ACTIVE = "ACTIVE",
  MET = "MET",
  ENDED = "ENDED",
}

/**
 * Motivo opcional de não cumprimento, em opções fechadas. Nunca há texto
 * livre sobre o assunto: o app não pede relato de sofrimento, do mesmo jeito
 * que o fluxo de apoio não pede. `OTHER` é rótulo fechado.
 */
export enum SavingsGoalUnmetReason {
  UNEXPECTED_EXPENSE = "UNEXPECTED_EXPENSE",
  INCOME_DROP = "INCOME_DROP",
  CHANGED_PRIORITY = "CHANGED_PRIORITY",
  PREFER_NOT_SAY = "PREFER_NOT_SAY",
  OTHER = "OTHER",
}
