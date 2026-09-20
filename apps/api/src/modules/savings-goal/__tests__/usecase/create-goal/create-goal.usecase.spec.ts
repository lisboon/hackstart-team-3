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
      targetAmountCents: 20000,
      today,
    });

    expect(out.kind).toBe(SavingsGoalKind.MONTHLY);
    expect(out.targetMonths).toBeNull();
    expect(out.targetAmountCents).toBe(20000);
    expect(out.startMonth.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(g.create).toHaveBeenCalledTimes(1);
    const created = (g.create as jest.Mock).mock.calls[0][0] as SavingsGoal;
    expect(created.userId).toBe(userId);
    expect(created.companyId).toBe(companyId);
    // Meta mensal: o alvo do mês é o próprio valor.
    expect(created.monthlyTargetCents).toBe(20000);
  });

  it("creates an enduring goal with a term and a monthly target split from the total", async () => {
    const g = gateway();
    const out = await new CreateGoalUseCase(g).execute({
      userId,
      companyId,
      kind: SavingsGoalKind.ENDURING,
      targetAmountCents: 60000,
      targetMonths: 6,
      today,
    });

    expect(out.kind).toBe(SavingsGoalKind.ENDURING);
    expect(out.targetMonths).toBe(6);
    expect(out.targetAmountCents).toBe(60000);
    const created = (g.create as jest.Mock).mock.calls[0][0] as SavingsGoal;
    // 60000 / 6 = 10000 centavos por mês.
    expect(created.monthlyTargetCents).toBe(10000);
  });

  it("rounds the monthly target to the cent when it does not divide evenly", async () => {
    const g = gateway();
    await new CreateGoalUseCase(g).execute({
      userId,
      companyId,
      kind: SavingsGoalKind.ENDURING,
      targetAmountCents: 10000,
      targetMonths: 3,
      today,
    });
    const created = (g.create as jest.Mock).mock.calls[0][0] as SavingsGoal;
    // 10000 / 3 = 3333.33… → 3333 centavos.
    expect(created.monthlyTargetCents).toBe(3333);
  });

  it("refuses a goal without a positive amount", async () => {
    await expect(
      new CreateGoalUseCase(gateway()).execute({
        userId,
        companyId,
        kind: SavingsGoalKind.MONTHLY,
        targetAmountCents: 0,
        today,
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });

  it("refuses an enduring goal without a term", async () => {
    await expect(
      new CreateGoalUseCase(gateway()).execute({
        userId,
        companyId,
        kind: SavingsGoalKind.ENDURING,
        targetAmountCents: 60000,
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
        targetAmountCents: 20000,
        targetMonths: 3,
        today,
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });
});
