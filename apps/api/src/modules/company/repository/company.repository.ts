import { PrismaClient } from "@prisma/client";
import { CompanyGateway } from "../gateway/company.gateway";
import { Company } from "../domain/company.entity";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { normalizeSlug } from "@/modules/@shared/domain/utils/slug";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { CompanyModelMapper } from "./company.model.mapper";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { executeWithUniqueConstraintTranslation } from "@/infra/database/prisma-operation";

const slugAlreadyInUse = () =>
  new EntityValidationError([
    { field: "slug", message: "Slug already in use" },
  ]);

export default class CompanyRepository implements CompanyGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    trx?: TransactionContext,
  ): Promise<Company | null> {
    const row = await resolvePrismaClient(this.prisma, trx).company.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? CompanyModelMapper.toEntity(row) : null;
  }

  async findBySlug(
    slug: string,
    trx?: TransactionContext,
  ): Promise<Company | null> {
    const row = await resolvePrismaClient(this.prisma, trx).company.findFirst({
      where: { slug: normalizeSlug(slug), deletedAt: null },
    });
    return row ? CompanyModelMapper.toEntity(row) : null;
  }

  async create(company: Company, trx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await executeWithUniqueConstraintTranslation(
      () =>
        client.company.create({
          data: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            active: company.active,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          },
        }),
      "slug",
      slugAlreadyInUse,
    );
  }

  async update(company: Company, trx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await executeWithUniqueConstraintTranslation(
      () =>
        client.company.update({
          where: { id: company.id },
          data: {
            name: company.name,
            slug: company.slug,
            active: company.active,
            updatedAt: company.updatedAt,
            deletedAt: company.deletedAt,
          },
        }),
      "slug",
      slugAlreadyInUse,
    );
  }
}
