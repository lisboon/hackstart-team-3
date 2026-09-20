import {
  ContentPiece,
  findOption,
} from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetJourneyUseCaseInputDto,
  GetJourneyUseCaseInterface,
  GetJourneyUseCaseOutputDto,
  JourneyNodeDto,
} from "./get-journey.usecase.dto";

export default class GetJourneyUseCase implements GetJourneyUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly contentPieceGateway: ContentPieceGateway,
  ) {}

  async execute(
    data: GetJourneyUseCaseInputDto,
  ): Promise<GetJourneyUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };

    // O catálogo já vem na ordem da trilha; as respostas dizem o que a pessoa
    // fez. As duas leituras não se cruzam no banco: o cruzamento é aqui, para
    // que o estado de cada nó seja derivado num lugar só.
    const [pieces, answers] = await Promise.all([
      this.contentPieceGateway.findAll(),
      this.dailyEntryGateway.findAnswers(owner),
    ]);

    // O primeiro não respondido é o atual; a partir do próximo, tudo tranca.
    // Assim só existe um `current`, e ninguém pula a fila da trilha.
    let currentSeen = false;

    const nodes: JourneyNodeDto[] = pieces.map((piece) => {
      const answer = answers.get(piece.id);
      if (answer !== undefined) {
        return this.answeredNode(piece, answer);
      }
      if (!currentSeen) {
        currentSeen = true;
        return this.currentNode(piece);
      }
      return this.lockedNode(piece);
    });

    return { nodes };
  }

  /**
   * A peça já respondida volta em leitura: o rótulo escolhido e a consequência
   * daquela escolha. Sem `options` — a decisão não se refaz. Se por algum
   * motivo o rótulo não casar com uma opção do catálogo (peça editada depois
   * da resposta), o `outcome` fica nulo em vez de inventar um texto.
   */
  private answeredNode(piece: ContentPiece, answer: string): JourneyNodeDto {
    const option = findOption(piece, answer);
    return {
      id: piece.id,
      stage: piece.stage,
      orderInStage: piece.orderInStage,
      title: piece.title,
      state: "answered",
      body: piece.body,
      prompt: piece.prompt,
      options: null,
      answer,
      outcome: option ? option.outcome : null,
      sourceUrl: piece.sourceUrl,
    };
  }

  /** A peça atual, como em `/me/today`: opções só com rótulo, sem consequência. */
  private currentNode(piece: ContentPiece): JourneyNodeDto {
    return {
      id: piece.id,
      stage: piece.stage,
      orderInStage: piece.orderInStage,
      title: piece.title,
      state: "current",
      body: piece.body,
      prompt: piece.prompt,
      options: piece.options.map((option) => ({ label: option.label })),
      answer: null,
      outcome: null,
      sourceUrl: piece.sourceUrl,
    };
  }

  /** Trancada: só o rótulo do nó. Nada do corpo, nada das opções. */
  private lockedNode(piece: ContentPiece): JourneyNodeDto {
    return {
      id: piece.id,
      stage: piece.stage,
      orderInStage: piece.orderInStage,
      title: piece.title,
      state: "locked",
      body: null,
      prompt: null,
      options: null,
      answer: null,
      outcome: null,
      sourceUrl: piece.sourceUrl,
    };
  }
}
