import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { findOption } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntry } from "../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  AnswerPieceUseCaseInputDto,
  AnswerPieceUseCaseInterface,
  AnswerPieceUseCaseOutputDto,
} from "./answer-piece.usecase.dto";

export default class AnswerPieceUseCase implements AnswerPieceUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly contentPieceGateway: ContentPieceGateway,
  ) {}

  async execute(
    data: AnswerPieceUseCaseInputDto,
  ): Promise<AnswerPieceUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const entryDate = normalizeToDayStart(data.today);
    const entry = await this.dailyEntryGateway.findByDate(owner, entryDate);

    // O humor abre o dia. Sem ele não há onde guardar a resposta, e a tela
    // não deveria ter chegado até aqui.
    if (!entry) {
      throw new ConflictError("Today's mood has not been answered yet");
    }

    const piece = await this.contentPieceGateway.findById(data.contentPieceId);
    if (!piece) {
      throw new NotFoundError(data.contentPieceId, DailyEntry);
    }

    const option = findOption(piece, data.answer);
    if (!option) {
      throw new NotFoundError(data.answer, DailyEntry);
    }

    entry.answerPiece(piece.id, option.label, option.demonstratesComprehension);
    await this.dailyEntryGateway.update(entry);

    return {
      outcome: option.outcome,
      comprehended: option.demonstratesComprehension,
      sourceUrl: piece.sourceUrl,
    };
  }
}
