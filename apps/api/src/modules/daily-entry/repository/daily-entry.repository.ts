import { PrismaClient } from "@prisma/client";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { DailyEntry } from "../domain/daily-entry.entity";
import {
  DailyEntryGateway,
  DailyEntryOwner,
} from "../gateway/daily-entry.gateway";
import { DailyEntryModelMapper } from "./daily-entry.model.mapper";

export default class DailyEntryRepository implements DailyEntryGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDate(
    owner: DailyEntryOwner,
    entryDate: Date,
    trx?: TransactionContext,
  ): Promise<DailyEntry | null> {
    const row = await resolvePrismaClient(
      this.prisma,
      trx,
    ).dailyEntry.findFirst({
      where: { ...owner, entryDate, deletedAt: null },
    });
    return row ? DailyEntryModelMapper.toEntity(row) : null;
  }

  async create(entry: DailyEntry, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).dailyEntry.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        companyId: entry.companyId,
        entryDate: entry.entryDate,
        mood: entry.mood,
        active: entry.active,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  }

  async update(entry: DailyEntry, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).dailyEntry.update({
      where: { id: entry.id },
      data: {
        mood: entry.mood,
        active: entry.active,
        updatedAt: entry.updatedAt,
        deletedAt: entry.deletedAt,
      },
    });
  }
}
