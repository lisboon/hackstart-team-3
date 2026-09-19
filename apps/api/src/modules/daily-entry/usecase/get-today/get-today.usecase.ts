import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { ContentPiece } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetTodayEntryUseCaseInputDto,
  GetTodayEntryUseCaseInterface,
  GetTodayEntryUseCaseOutputDto,
  TodayPieceDto,
} from "./get-today.usecase.dto";

export default class GetTodayEntryUseCase implements GetTodayEntryUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly contentPieceGateway: ContentPieceGateway,
  ) {}

  async execute(
    data: GetTodayEntryUseCaseInputDto,
  ): Promise<GetTodayEntryUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const entryDate = normalizeToDayStart(data.today);
    const entry = await this.dailyEntryGateway.findByDate(owner, entryDate);

    // Sem humor não há peça: a pergunta de abertura vem antes do conteúdo.
    if (!entry) {
      return {
        entryDate,
        answered: false,
        mood: null,
        pieceAnswered: false,
        piece: null,
      };
    }

    const piece = entry.pieceAnswered
      ? null
      : await this.contentPieceGateway.findNext(
          await this.dailyEntryGateway.findAnsweredPieceIds(owner),
        );

    return {
      entryDate,
      answered: true,
      mood: entry.mood,
      pieceAnswered: entry.pieceAnswered,
      piece: piece ? this.present(piece) : null,
    };
  }

  /** A consequência de cada opção só é revelada depois da escolha. */
  private present(piece: ContentPiece): TodayPieceDto {
    return {
      id: piece.id,
      stage: piece.stage,
      title: piece.title,
      body: piece.body,
      prompt: piece.prompt,
      options: piece.options.map((option) => ({ label: option.label })),
      sourceUrl: piece.sourceUrl,
    };
  }
}
