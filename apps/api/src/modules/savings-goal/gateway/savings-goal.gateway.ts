import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { SavingsGoal } from "../domain/savings-goal.entity";

export interface SavingsGoalOwner {
  userId: string;
  companyId: string;
}

/**
 * Recurso estritamente pessoal: não existe busca por id nem por usuário
 * isolado. Toda leitura exige dono e empresa juntos, inclusive para ADMIN. A
 * meta e o motivo nunca são agregados nem expostos ao gestor.
 */
export interface SavingsGoalGateway {
  /** Todas as metas da pessoa, mais recentes primeiro. */
  findAll(
    owner: SavingsGoalOwner,
    trx?: TransactionContext,
  ): Promise<SavingsGoal[]>;

  /**
   * Uma meta da pessoa por id. Recebe o dono junto: sem empresa e usuário, não
   * há leitura — o id sozinho não abre caminho para a meta de outra pessoa.
   */
  findOwned(
    owner: SavingsGoalOwner,
    id: string,
    trx?: TransactionContext,
  ): Promise<SavingsGoal | null>;

  create(goal: SavingsGoal, trx?: TransactionContext): Promise<void>;

  update(goal: SavingsGoal, trx?: TransactionContext): Promise<void>;
}
