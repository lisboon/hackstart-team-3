import { CoopsStage } from "@/modules/@shared/domain/enums";

export interface ContentOption {
  label: string;
  /** O que acontece se a pessoa escolher isso. Sempre mostrado, escolha qual for. */
  outcome: string;
  /** Marca a escolha coerente com o que a peça acabou de ensinar. */
  demonstratesComprehension: boolean;
}

/**
 * Peça de leitura curta seguida de uma decisão. Não é quiz: a pessoa escolhe o
 * que faria e vê a consequência de qualquer escolha. A compreensão é medida
 * pela coerência com o que acabou de ler, e errar não é punido.
 */
export interface ContentPiece {
  id: string;
  stage: CoopsStage;
  orderInStage: number;
  title: string;
  body: string;
  prompt: string;
  options: ContentOption[];
  sourceUrl: string;
}

export function findOption(
  piece: ContentPiece,
  label: string,
): ContentOption | undefined {
  return piece.options.find((option) => option.label === label);
}
