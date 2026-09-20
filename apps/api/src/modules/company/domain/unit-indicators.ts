/**
 * Agregar quatro pessoas não anonimiza ninguém: num grupo pequeno a média
 * entrega o indivíduo, e basta o gestor saber quem faltou para ler o número
 * como se fosse de uma pessoa só.
 */
export const MINIMUM_GROUP_SIZE = 5;

/**
 * Contagens cruas de um período. Nenhuma decisão mora aqui.
 *
 * Cada indicador tem a **sua** população, e elas não coincidem: quem declarou o
 * mês não é quem registrou humor. Guardar os dois tamanhos é o que permite
 * suprimir indicador por indicador em vez de olhar só o total de gente ativa.
 */
export interface UnitTally {
  active: number;
  declarers: number;
  tightDeclarers: number;
  moodPeople: number;
  averageMood: number | null;
  entries: number;
  /**
   * Aberturas de recurso de apoio no período. Contagem da unidade, sem
   * população de declarantes atrás: os eventos não sabem de quem são, então não
   * há grupo individual para proteger — este indicador cai com o portão geral,
   * como `headcount` e `reach`.
   */
  supportUses: number;
  accessSeries: UnitAccessDay[];
}

/**
 * Um dia da série de acessos. `DailyEntry` é único por pessoa e data, então
 * contar linhas de um dia é contar pessoas daquele dia — não há visita
 * repetida inflando o número.
 */
export interface UnitAccessDay {
  date: Date;
  people: number;
}

/** Tamanho da unidade, independente de período. */
export interface UnitPopulation {
  headcount: number;
  reach: number;
}

export interface UnitPeriod {
  from: Date;
  to: Date;
}
