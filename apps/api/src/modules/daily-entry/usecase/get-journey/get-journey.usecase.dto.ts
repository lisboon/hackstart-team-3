import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { CoopsStage } from "@/modules/@shared/domain/enums";

/**
 * O estado de cada nó da trilha, derivado no servidor:
 * - `answered`: peça já respondida. A consequência já vista volta para leitura.
 * - `current`: a próxima peça a responder, e a única com opções abertas.
 * - `locked`: ainda não chegou a vez. Só título e etapa; nada do corpo.
 *
 * Só existe um `current` por vez, e ele é a primeira peça não respondida na
 * ordem do COOPS. Peças respondidas não voltam a ser respondíveis — este
 * endpoint é de leitura e não reabre a decisão.
 */
export type JourneyNodeState = "answered" | "current" | "locked";

export interface JourneyOptionDto {
  label: string;
}

/**
 * Um nó da trilha. Os campos presentes dependem do estado, e essa assimetria é
 * proposital: revelar corpo ou consequência fora de hora seria gabarito.
 *
 * - `current` traz `body`, `prompt` e `options` (só rótulos), como em `/me/today`.
 * - `answered` traz o `answer` escolhido e o `outcome` daquela escolha, para
 *   leitura. Não traz `options`: não há o que decidir de novo.
 * - `locked` traz apenas `id`, `stage`, `orderInStage` e `title`.
 */
export interface JourneyNodeDto {
  id: string;
  stage: CoopsStage;
  orderInStage: number;
  title: string;
  state: JourneyNodeState;
  body: string | null;
  prompt: string | null;
  options: JourneyOptionDto[] | null;
  answer: string | null;
  outcome: string | null;
  sourceUrl: string;
}

export interface GetJourneyUseCaseInputDto {
  userId: string;
  companyId: string;
}

/**
 * A trilha inteira, na ordem do método. Todas as peças do catálogo vêm, em
 * qualquer estado: o mapa precisa mostrar o caminho completo, inclusive o que
 * ainda está trancado.
 */
export interface GetJourneyUseCaseOutputDto {
  nodes: JourneyNodeDto[];
}

export type GetJourneyUseCaseInterface = BaseUseCase<
  GetJourneyUseCaseInputDto,
  GetJourneyUseCaseOutputDto
>;
