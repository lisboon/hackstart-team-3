import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { ContentPiece } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import { CompanyGateway } from "@/modules/company/gateway/company.gateway";
import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  journeyWindowAt,
} from "@/modules/company/domain/journey-window";
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
    private readonly companyGateway: CompanyGateway,
    /**
     * A janela vem da unidade (#76). O padrão do processo é só o que vale para
     * empresa que nunca configurou a sua.
     */
    private readonly fallbackWindow: JourneyWindow = DEFAULT_JOURNEY_WINDOW,
  ) {}

  async execute(
    data: GetTodayEntryUseCaseInputDto,
  ): Promise<GetTodayEntryUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const entryDate = normalizeToDayStart(data.today);
    const entry = await this.dailyEntryGateway.findByDate(owner, entryDate);
    // A tela precisa do horario para mostrar "abre segunda, as 07:30" em vez de
    // uma pergunta que o servidor vai recusar.
    const window = journeyWindowAt(
      data.today,
      (await this.companyGateway.findJourneyWindow(data.companyId)) ??
        this.fallbackWindow,
    );

    // "Respondido" é ter declarado o humor — não a entrada que a colheita
    // possa ter aberto automaticamente. Enquanto o humor for o neutro
    // automático, a abertura ainda pede a declaração.
    const moodDeclared = entry?.moodDeclared ?? false;
    if (!entry || !moodDeclared) {
      return {
        entryDate,
        answered: false,
        mood: null,
        note: null,
        pieceAnswered: entry?.pieceAnswered ?? false,
        piece: null,
        window,
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
      note: entry.note ?? null,
      pieceAnswered: entry.pieceAnswered,
      piece: piece ? this.present(piece) : null,
      window,
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
