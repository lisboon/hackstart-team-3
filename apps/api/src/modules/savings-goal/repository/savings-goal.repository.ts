import { PrismaClient } from "@prisma/client";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { SavingsGoal } from "../domain/savings-goal.entity";
import {
  SavingsGoalGateway,
  SavingsGoalOwner,
} from "../gateway/savings-goal.gateway";
import { SavingsGoalModelMapper } from "./savings-goal.model.mapper";

export default class SavingsGoalRepository implements SavingsGoalGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    owner: SavingsGoalOwner,
    trx?: TransactionContext,
  ): Promise<SavingsGoal[]> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).savingsGoal.findMany({
      where: { ...owner, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(SavingsGoalModelMapper.toEntity);
  }

  async findOwned(
    owner: SavingsGoalOwner,
    id: string,
    trx?: TransactionContext,
  ): Promise<SavingsGoal | null> {
    const row = await resolvePrismaClient(
      this.prisma,
      trx,
    ).savingsGoal.findFirst({
      where: { ...owner, id, deletedAt: null },
    });
    return row ? SavingsGoalModelMapper.toEntity(row) : null;
  }

  async create(goal: SavingsGoal, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).savingsGoal.create({
      data: {
        id: goal.id,
        userId: goal.userId,
        companyId: goal.companyId,
        kind: goal.kind,
        targetAmountCents: goal.targetAmountCents,
        targetMonths: goal.targetMonths ?? null,
        startMonth: goal.startMonth,
        status: goal.status,
        unmetReason: goal.unmetReason ?? null,
        active: goal.active,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    });
  }

  async update(goal: SavingsGoal, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).savingsGoal.update({
      where: { id: goal.id },
      data: {
        kind: goal.kind,
        targetMonths: goal.targetMonths ?? null,
        startMonth: goal.startMonth,
        status: goal.status,
        unmetReason: goal.unmetReason ?? null,
        active: goal.active,
        updatedAt: goal.updatedAt,
        deletedAt: goal.deletedAt,
      },
    });
  }
}
