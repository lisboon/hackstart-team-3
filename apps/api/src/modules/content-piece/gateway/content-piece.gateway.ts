import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { CoopsStage } from "@/modules/@shared/domain/enums";
import { ContentPiece } from "../domain/content-piece.entity";

export interface StageCount {
  stage: CoopsStage;
  count: number;
}

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

  /**
   * Quantas peças o catálogo tem por etapa. Sem `onlyIds` conta a trilha
   * inteira; com uma lista, conta só as peças dela — é assim que o progresso
   * de alguém sai da mesma consulta, sem um segundo caminho de leitura.
   *
   * Etapa sem nenhuma peça não aparece no resultado: quem chama decide o que
   * fazer com a ausência.
   */
  countByStage(
    onlyIds?: string[],
    trx?: TransactionContext,
  ): Promise<StageCount[]>;
}
