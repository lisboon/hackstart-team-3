import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { ContentPiece } from "../domain/content-piece.entity";

export interface ContentPieceGateway {
  findById(id: string, trx?: TransactionContext): Promise<ContentPiece | null>;

  /**
   * A próxima peça da trilha, ignorando as que a pessoa já respondeu. O
   * catálogo é o mesmo para todo mundo: nada aqui depende de dado pessoal.
   */
  findNext(
    answeredIds: string[],
    trx?: TransactionContext,
  ): Promise<ContentPiece | null>;
}
