import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { findOption } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntry } from "../../domain/daily-entry.entity";
import { NEUTRAL_MOOD } from "../../domain/mood";
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
    let entry = await this.dailyEntryGateway.findByDate(owner, entryDate);
    let isNew = false;

    // Colheita e humor são independentes: responder não exige o dia aberto.
    // Sem entrada ainda, a colheita abre o dia com humor neutro automático
    // (não declarado), que o registro real de humor sobrescreve depois (#64).
    if (!entry) {
      entry = DailyEntry.createAutomatic({ ...owner, entryDate }, NEUTRAL_MOOD);
      isNew = true;
    } else if (entry.pieceAnswered) {
      // Se o dia já tem colheita respondida, nada mais importa: validar a peça
      // primeiro faria um envio repetido responder 404 em vez de 409.
      throw new ConflictError("Today's piece is already answered");
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
    // Entrada nova (aberta pela colheita) é criada; existente é atualizada.
    if (isNew) {
      await this.dailyEntryGateway.create(entry);
    } else {
      await this.dailyEntryGateway.update(entry);
    }

    return {
      outcome: option.outcome,
      comprehended: option.demonstratesComprehension,
      sourceUrl: piece.sourceUrl,
    };
  }
}
