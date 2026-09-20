import { SavingsGoalKind } from "@/modules/@shared/domain/enums";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { SavingsGoalGateway } from "../../../gateway/savings-goal.gateway";
import { SavingsGoal } from "../../../domain/savings-goal.entity";
import CreateGoalUseCase from "../../../usecase/create-goal/create-goal.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const today = new Date(Date.UTC(2026, 8, 19, 15, 0));

const gateway = (): SavingsGoalGateway => ({
  findAll: jest.fn(),
  findOwned: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

describe("CreateGoalUseCase", () => {
  it("creates a monthly goal starting on the current month, with no term", async () => {
    const g = gateway();
    const out = await new CreateGoalUseCase(g).execute({
      userId,
      companyId,
      kind: SavingsGoalKind.MONTHLY,
      today,
    });

    expect(out.kind).toBe(SavingsGoalKind.MONTHLY);
    expect(out.targetMonths).toBeNull();
    expect(out.startMonth.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(g.create).toHaveBeenCalledTimes(1);
    const created = (g.create as jest.Mock).mock.calls[0][0] as SavingsGoal;
    expect(created.userId).toBe(userId);
    expect(created.companyId).toBe(companyId);
  });

  it("creates an enduring goal with a term", async () => {
    const g = gateway();
    const out = await new CreateGoalUseCase(g).execute({
      userId,
      companyId,
      kind: SavingsGoalKind.ENDURING,
      targetMonths: 6,
      today,
    });

    expect(out.kind).toBe(SavingsGoalKind.ENDURING);
    expect(out.targetMonths).toBe(6);
  });

  it("refuses an enduring goal without a term", async () => {
    await expect(
      new CreateGoalUseCase(gateway()).execute({
        userId,
        companyId,
        kind: SavingsGoalKind.ENDURING,
        today,
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });

  it("refuses a monthly goal that carries a term", async () => {
    await expect(
      new CreateGoalUseCase(gateway()).execute({
        userId,
        companyId,
        kind: SavingsGoalKind.MONTHLY,
        targetMonths: 3,
        today,
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });
});
