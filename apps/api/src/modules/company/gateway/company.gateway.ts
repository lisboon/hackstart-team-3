import { Company } from "../domain/company.entity";
import {
  JourneyExceptionView,
  JourneyShift,
  JourneyWindow,
} from "../domain/journey-window";
import {
  UnitPeriod,
  UnitPopulation,
  UnitTally,
} from "../domain/unit-indicators";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";

export interface CompanyGateway {
  findById(id: string, trx?: TransactionContext): Promise<Company | null>;
  findBySlug(slug: string, trx?: TransactionContext): Promise<Company | null>;
  create(company: Company, trx?: TransactionContext): Promise<void>;
  update(company: Company, trx?: TransactionContext): Promise<void>;

  /**
   * A janela de escrita da unidade: fuso mais as faixas de expediente. Leitura
   * apartada de `findById` de propósito — a sessão é revalidada a cada
   * requisição e não precisa carregar as faixas junto.
   *
   * Devolve `null` quando a empresa não existe **ou** não configurou faixa
   * nenhuma; quem chama cai no padrão do processo. Empresa sem configuração
   * própria segue com seg–sex, 07:30–18:00.
   */
  findJourneyWindow(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<JourneyWindow | null>;

  /** Substitui as faixas da unidade pela lista inteira. Idempotente. */
  replaceJourneyShifts(
    companyId: string,
    shifts: readonly JourneyShift[],
    trx?: TransactionContext,
  ): Promise<void>;

  /** Os dias sem expediente da unidade, com o motivo, para a tela do gestor. */
  findJourneyExceptions(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<JourneyExceptionView[]>;

  /** Substitui os dias sem expediente pela lista inteira. Idempotente. */
  replaceJourneyExceptions(
    companyId: string,
    exceptions: readonly JourneyExceptionView[],
    trx?: TransactionContext,
  ): Promise<void>;

  /**
   * Agregados de uma unidade. Devolve contagens, nunca linhas: nada individual
   * sai daqui, e por isso não existe recorte por usuário na assinatura.
   */
  findTally(companyId: string, period: UnitPeriod): Promise<UnitTally>;
  countPopulation(companyId: string): Promise<UnitPopulation>;
}
