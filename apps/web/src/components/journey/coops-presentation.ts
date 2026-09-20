import type { CoopsStage } from "@/schemas/wellbeing";

/**
 * As cinco etapas na ordem do método COOPS. A ordem é a trilha: a pessoa
 * caminha por elas nesta sequência, e a tela agrupa por aqui em vez de pela
 * ordem em que as peças chegam do servidor.
 */
export const COOPS_ORDER = [
  "CONSCIENTIZAR",
  "OBSERVAR",
  "ORGANIZAR",
  "PREPARAR",
  "SUSTENTAR",
] as const satisfies readonly CoopsStage[];

/**
 * As etapas aparecem com o nome do método, não traduzidas: é vocabulário do
 * programa Cooperação na Ponta do Lápis, e reconhecê-lo é parte do valor para
 * quem já participou de uma formação do Sicredi.
 */
export const STAGE_LABEL: Readonly<Record<CoopsStage, string>> = {
  CONSCIENTIZAR: "Conscientizar",
  OBSERVAR: "Observar",
  ORGANIZAR: "Organizar",
  PREPARAR: "Preparar",
  SUSTENTAR: "Sustentar",
};
