import { PrismaClient } from "@prisma/client";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { SelfReport } from "../domain/self-report.entity";
import {
  SelfReportGateway,
  SelfReportOwner,
} from "../gateway/self-report.gateway";
import { SelfReportModelMapper } from "./self-report.model.mapper";

export default class SelfReportRepository implements SelfReportGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findByMonth(
    owner: SelfReportOwner,
    referenceMonth: Date,
    trx?: TransactionContext,
  ): Promise<SelfReport | null> {
    const row = await resolvePrismaClient(
      this.prisma,
      trx,
    ).selfReport.findFirst({
      where: { ...owner, referenceMonth, deletedAt: null },
    });
    return row ? SelfReportModelMapper.toEntity(row) : null;
  }

  async findSince(
    owner: SelfReportOwner,
    from: Date,
    trx?: TransactionContext,
  ): Promise<SelfReport[]> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).selfReport.findMany({
      where: { ...owner, referenceMonth: { gte: from }, deletedAt: null },
      orderBy: { referenceMonth: "desc" },
    });
    return rows.map(SelfReportModelMapper.toEntity);
  }

  async create(
    selfReport: SelfReport,
    trx?: TransactionContext,
  ): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).selfReport.create({
      data: {
        id: selfReport.id,
        userId: selfReport.userId,
        companyId: selfReport.companyId,
        referenceMonth: selfReport.referenceMonth,
        situation: selfReport.situation,
        active: selfReport.active,
        createdAt: selfReport.createdAt,
        updatedAt: selfReport.updatedAt,
      },
    });
  }

  async update(
    selfReport: SelfReport,
    trx?: TransactionContext,
  ): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).selfReport.update({
      where: { id: selfReport.id },
      data: {
        situation: selfReport.situation,
        active: selfReport.active,
        updatedAt: selfReport.updatedAt,
        deletedAt: selfReport.deletedAt,
      },
    });
  }
}
