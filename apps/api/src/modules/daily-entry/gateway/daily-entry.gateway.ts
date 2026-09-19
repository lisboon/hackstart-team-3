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

  create(entry: DailyEntry, trx?: TransactionContext): Promise<void>;

  update(entry: DailyEntry, trx?: TransactionContext): Promise<void>;
}
