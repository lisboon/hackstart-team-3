import { Company } from "../domain/company.entity";
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
   * Agregados de uma unidade. Devolve contagens, nunca linhas: nada individual
   * sai daqui, e por isso não existe recorte por usuário na assinatura.
   */
  findTally(companyId: string, period: UnitPeriod): Promise<UnitTally>;
  countPopulation(companyId: string): Promise<UnitPopulation>;
}
