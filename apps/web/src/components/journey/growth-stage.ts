/**
 * O estágio de crescimento da pessoa: semente → broto → muda → planta → fruto.
 *
 * É nível **individual**, derivado dos pontos que ela mesma acumulou. Não é
 * liga: não há tabela, não há divisão, ninguém sobe às custas de ninguém e
 * ninguém cai. A distinção importa neste produto — a pessoa que apareceria no
 * fim de uma tabela de engajamento tende a ser justamente a que está em maior
 * sofrimento financeiro, e a tese escrita é mostrar o que ela já conseguiu, não
 * onde ela está em relação aos outros (`CLAUDE.md`).
 *
 * Os limiares são de seis peças cada — o tamanho de uma etapa do COOPS — então
 * o crescimento acompanha o método em vez de um número inventado.
 */

import { POINTS_PER_PIECE } from "@/components/journey/coops-sections";

export interface GrowthStage {
  key: "semente" | "broto" | "muda" | "planta" | "fruto";
  label: string;
  /** Pontos a partir dos quais o estágio vale. */
  from: number;
  /** O que a tela mostra junto do nome, sem prometer nada a ninguém. */
  caption: string;
}

/** Uma etapa do COOPS: seis peças. */
const STEP = 6 * POINTS_PER_PIECE;

export const GROWTH_STAGES: readonly GrowthStage[] = [
  {
    key: "semente",
    label: "Semente",
    from: 0,
    caption: "Você começou. É daqui que sai tudo.",
  },
  {
    key: "broto",
    label: "Broto",
    from: STEP,
    caption: "Já rompeu a terra: o hábito apareceu.",
  },
  {
    key: "muda",
    label: "Muda",
    from: STEP * 2,
    caption: "Firme o bastante para aguentar um mês ruim.",
  },
  {
    key: "planta",
    label: "Planta",
    from: STEP * 3,
    caption: "Cresce sozinha, mesmo quando você não olha.",
  },
  {
    key: "fruto",
    label: "Fruto",
    from: STEP * 4,
    caption: "O que você plantou já dá colheita.",
  },
];

export interface GrowthProgress {
  stage: GrowthStage;
  /** O próximo estágio, ou `null` em Fruto — de onde não se cai. */
  next: GrowthStage | null;
  /** Quantos pontos faltam para o próximo, ou 0 quando não há próximo. */
  toNext: number;
  /** Avanço dentro do estágio atual, de 0 a 1, para o anel. */
  ratio: number;
}

/**
 * O estágio de quem tem estes pontos, e o quanto falta para o próximo.
 *
 * Não existe queda: os pontos só sobem, porque contam peças respondidas, e
 * peça respondida não desacontece. Estágio que se perde é o que transforma
 * ofensiva em culpa, e isso é o oposto do produto.
 */
export function growthProgress(points: number): GrowthProgress {
  const index = GROWTH_STAGES.reduce(
    (found, candidate, i) => (points >= candidate.from ? i : found),
    0,
  );
  const stage = GROWTH_STAGES[index];
  const next = GROWTH_STAGES[index + 1] ?? null;

  if (!next) return { stage, next, toNext: 0, ratio: 1 };

  const span = next.from - stage.from;
  return {
    stage,
    next,
    toNext: next.from - points,
    ratio: Math.min(Math.max((points - stage.from) / span, 0), 1),
  };
}
