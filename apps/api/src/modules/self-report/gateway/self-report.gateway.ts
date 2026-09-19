import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { SelfReport } from "../domain/self-report.entity";

export interface SelfReportOwner {
  userId: string;
  companyId: string;
}

/**
 * Não existe busca por id nem por usuário isolado: toda leitura exige dono e
 * empresa juntos. A regra de isolamento fica na assinatura, e não na disciplina
 * de quem chama — inclusive para ADMIN, que aqui não tem exceção.
 */
export interface SelfReportGateway {
  findByMonth(
    owner: SelfReportOwner,
    referenceMonth: Date,
    trx?: TransactionContext,
  ): Promise<SelfReport | null>;

  findSince(
    owner: SelfReportOwner,
    from: Date,
    trx?: TransactionContext,
  ): Promise<SelfReport[]>;

  create(selfReport: SelfReport, trx?: TransactionContext): Promise<void>;

  update(selfReport: SelfReport, trx?: TransactionContext): Promise<void>;
}
