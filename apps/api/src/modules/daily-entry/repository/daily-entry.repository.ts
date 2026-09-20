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

  async findAnsweredPieceIds(
    owner: DailyEntryOwner,
    trx?: TransactionContext,
  ): Promise<string[]> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).dailyEntry.findMany({
      where: { ...owner, contentPieceId: { not: null }, deletedAt: null },
      select: { contentPieceId: true },
    });
    return rows
      .map((row) => row.contentPieceId)
      .filter((id): id is string => id !== null);
  }

  async findAnswers(
    owner: DailyEntryOwner,
    trx?: TransactionContext,
  ): Promise<Map<string, string>> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).dailyEntry.findMany({
      where: {
        ...owner,
        contentPieceId: { not: null },
        answer: { not: null },
        deletedAt: null,
      },
      select: { contentPieceId: true, answer: true },
    });
    const answers = new Map<string, string>();
    for (const row of rows) {
      if (row.contentPieceId !== null && row.answer !== null) {
        answers.set(row.contentPieceId, row.answer);
      }
    }
    return answers;
  }

  async findEntryDates(
    owner: DailyEntryOwner,
    trx?: TransactionContext,
  ): Promise<Date[]> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).dailyEntry.findMany({
      where: { ...owner, deletedAt: null },
      select: { entryDate: true },
      orderBy: { entryDate: "asc" },
    });
    return rows.map((row) => row.entryDate);
  }

  async create(entry: DailyEntry, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).dailyEntry.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        companyId: entry.companyId,
        entryDate: entry.entryDate,
        mood: entry.mood,
        moodDeclared: entry.moodDeclared,
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
        moodDeclared: entry.moodDeclared,
        contentPieceId: entry.contentPieceId,
        answer: entry.answer,
        comprehended: entry.comprehended,
        active: entry.active,
        updatedAt: entry.updatedAt,
        deletedAt: entry.deletedAt,
      },
    });
  }
}
