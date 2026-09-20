import type { SavingsGoal as SavingsGoalModel } from "@prisma/client";
import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SavingsGoalUnmetReason,
} from "@/modules/@shared/domain/enums";
import { SavingsGoal } from "../domain/savings-goal.entity";

export class SavingsGoalModelMapper {
  static toEntity(data: SavingsGoalModel): SavingsGoal {
    return new SavingsGoal({
      id: data.id,
      userId: data.userId,
      companyId: data.companyId,
      kind: data.kind as SavingsGoalKind,
      targetAmountCents: data.targetAmountCents,
      targetMonths: data.targetMonths ?? undefined,
      startMonth: data.startMonth,
      status: data.status as SavingsGoalStatus,
      unmetReason:
        (data.unmetReason as SavingsGoalUnmetReason | null) ?? undefined,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }
}
