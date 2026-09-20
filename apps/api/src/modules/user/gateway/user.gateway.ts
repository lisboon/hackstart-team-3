import { User } from "../domain/user.entity";
import { UserFilter } from "./user.filter";
import { SearchParams } from "@/modules/@shared/repository/search-params";
import { SearchResult } from "@/modules/@shared/repository/search-result";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";

export interface UserGateway {
  findById(id: string, trx?: TransactionContext): Promise<User | null>;
  findByIdInCompany(
    id: string,
    companyId: string,
    trx?: TransactionContext,
  ): Promise<User | null>;
  findByEmail(email: string, trx?: TransactionContext): Promise<User | null>;
  search(
    params: SearchParams<UserFilter>,
    trx?: TransactionContext,
  ): Promise<SearchResult<User>>;
  countActiveAdmins(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<number>;

  /**
   * Segura a linha da empresa até o fim da transação, para que duas decisões
   * sobre o mesmo quadro de administradores aconteçam em fila em vez de
   * colidirem.
   *
   * `countActiveAdmins` é uma contagem sobre predicado, e em `Serializable` o
   * Postgres a transforma em lock de predicado: duas exclusões simultâneas de
   * administradores **diferentes** lêem 2, as duas seguem, e o banco aborta
   * uma por anomalia de serialização. Isso é o banco certo, não um defeito —
   * mas quem chamou recebe um erro de escrita em vez de "não é possível
   * remover o último administrador ativo".
   *
   * Refazer a transação é aposta; pôr as duas em fila é certeza.
   */
  lockCompany(companyId: string, trx: TransactionContext): Promise<void>;
  countActiveByCompany(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<number>;
  create(user: User, trx?: TransactionContext): Promise<void>;
  update(user: User, trx?: TransactionContext): Promise<void>;
}
