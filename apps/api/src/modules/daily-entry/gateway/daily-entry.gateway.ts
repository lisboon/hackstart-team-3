import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { DailyEntry } from "../domain/daily-entry.entity";

export interface DailyEntryOwner {
  userId: string;
  companyId: string;
}

/**
 * Mesma regra do self-report: não existe busca por id nem por usuário isolado.
 * Toda leitura exige dono e empresa juntos, inclusive para ADMIN.
 */
export interface DailyEntryGateway {
  findByDate(
    owner: DailyEntryOwner,
    entryDate: Date,
    trx?: TransactionContext,
  ): Promise<DailyEntry | null>;

  /** Os ids de peça que a pessoa já respondeu, para a trilha não repetir. */
  findAnsweredPieceIds(
    owner: DailyEntryOwner,
    trx?: TransactionContext,
  ): Promise<string[]>;

  /**
   * O rótulo escolhido em cada peça já respondida, indexado por peça. É o que
   * permite revelar de novo a consequência de uma peça concluída — em leitura,
   * nunca reabrindo a decisão. Como todo recurso pessoal, exige dono e empresa
   * juntos e não expõe caminho por id.
   */
  findAnswers(
    owner: DailyEntryOwner,
    trx?: TransactionContext,
  ): Promise<Map<string, string>>;

  create(entry: DailyEntry, trx?: TransactionContext): Promise<void>;

  update(entry: DailyEntry, trx?: TransactionContext): Promise<void>;
}
