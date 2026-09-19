/**
 * As cinco etapas do método COOPS, do programa Cooperação na Ponta do Lápis,
 * do próprio Sicredi. São a trilha: a pessoa caminha por elas na ordem, e o
 * produto entrega em minutos por dia o que hoje chega como formação longa.
 */
export enum CoopsStage {
  CONSCIENTIZAR = "CONSCIENTIZAR",
  OBSERVAR = "OBSERVAR",
  ORGANIZAR = "ORGANIZAR",
  PREPARAR = "PREPARAR",
  SUSTENTAR = "SUSTENTAR",
}

export const COOPS_ORDER: readonly CoopsStage[] = [
  CoopsStage.CONSCIENTIZAR,
  CoopsStage.OBSERVAR,
  CoopsStage.ORGANIZAR,
  CoopsStage.PREPARAR,
  CoopsStage.SUSTENTAR,
];
