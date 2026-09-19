import { Company } from "../domain/company.entity";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";

export interface CompanyGateway {
  findById(id: string, trx?: TransactionContext): Promise<Company | null>;
  findBySlug(slug: string, trx?: TransactionContext): Promise<Company | null>;
  create(company: Company, trx?: TransactionContext): Promise<void>;
  update(company: Company, trx?: TransactionContext): Promise<void>;
}
