import type { CoopsStage } from "@/schemas/wellbeing";

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
