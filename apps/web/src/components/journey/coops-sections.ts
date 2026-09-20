import { COOPS_ORDER } from "@/components/journey/coops-presentation";
import type { CoopsStage, JourneyNode } from "@/schemas/wellbeing";

/**
 * A trilha agrupada pelas etapas do método COOPS.
 *
 * O método é o produto, e até aqui a tela não o mostrava: todos os nós caíam
 * numa serpentina só, sem dizer onde uma etapa termina e a outra começa.
 *
 * As contagens saem do próprio `GET /me/journey`, que já devolve **todas** as
 * peças do catálogo com `stage` e `orderInStage`. Pedir `GET /me/track` seria
 * uma segunda ida ao servidor por um subconjunto do que já está em mãos, mais
 * um segundo estado de carregamento — e duas fontes que podem divergir.
 *
 * O que se perde em relação ao `/me/track`: ele devolve as cinco etapas mesmo
 * quando `total` é zero, e a derivação só enxerga etapa que tem peça. Para um
 * mapa isso está certo — não há o que caminhar numa etapa vazia.
 */

export type StageSectionState = "done" | "current" | "locked";

export interface StageSection {
  stage: CoopsStage;
  /** Os nós da etapa, na ordem do método. */
  nodes: JourneyNode[];
  total: number;
  answered: number;
  /** `current` é a etapa que contém a peça de hoje — existe no máximo uma. */
  state: StageSectionState;
}

/**
 * Quanto uma peça respondida vale. O cliente aprovou pontos por brinde do
 * Sicredi, e a loja é escopo posterior: aqui o ponto é **derivado** do que a
 * pessoa já fez, não um saldo guardado no servidor. Ver `docs/aderencia-ao-desafio.md`.
 */
export const POINTS_PER_PIECE = 15;

export function coopsSections(nodes: JourneyNode[]): StageSection[] {
  // Ordem canônica do método, e não ordem de aparição: assim a trilha não muda
  // de forma se alguém reordenar o catálogo.
  return COOPS_ORDER.map((stage) => sectionOf(stage, nodes)).filter(
    (section) => section.total > 0,
  );
}

function sectionOf(stage: CoopsStage, all: JourneyNode[]): StageSection {
  const nodes = all
    .filter((node) => node.stage === stage)
    .sort((a, b) => a.orderInStage - b.orderInStage);

  const answered = nodes.filter((node) => node.state === "answered").length;
  const hasCurrent = nodes.some((node) => node.state === "current");

  return {
    stage,
    nodes,
    total: nodes.length,
    answered,
    state: hasCurrent ? "current" : sectionState(nodes.length, answered),
  };
}

function sectionState(total: number, answered: number): StageSectionState {
  return total > 0 && answered === total ? "done" : "locked";
}

/** Os pontos acumulados: uma função do que a pessoa respondeu, nada mais. */
export function journeyPoints(nodes: JourneyNode[]): number {
  return (
    nodes.filter((node) => node.state === "answered").length * POINTS_PER_PIECE
  );
}
