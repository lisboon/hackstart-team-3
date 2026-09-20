import { CoopsStage } from "@/modules/@shared/domain/enums";

export class JourneyOptionResponseDto {
  label: string;
}

/**
 * Um nó da trilha. A presença dos campos depende do estado, e a assimetria é
 * proposital: revelar corpo ou consequência fora de hora seria gabarito.
 *
 * - `current`: a próxima a responder. Traz `body`, `prompt` e `options` (só
 *   rótulos), como em `/me/today`.
 * - `answered`: respondida. Traz `answer` e `outcome` para leitura, sem
 *   `options` — a decisão não se refaz.
 * - `locked`: ainda trancada. Só o rótulo do nó.
 */
export class JourneyNodeResponseDto {
  id: string;
  stage: CoopsStage;
  orderInStage: number;
  title: string;
  state: "answered" | "current" | "locked";
  body: string | null;
  prompt: string | null;
  options: JourneyOptionResponseDto[] | null;
  answer: string | null;
  outcome: string | null;
  sourceUrl: string;
}

/**
 * A trilha inteira na ordem do COOPS, incluindo as peças trancadas: o mapa
 * mostra o caminho completo, não só o que já foi feito.
 */
export class JourneyResponseDto {
  nodes: JourneyNodeResponseDto[];
}
