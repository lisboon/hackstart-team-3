import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SavingsGoalUnmetReason,
} from "@/modules/@shared/domain/enums";
import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { SavingsGoal } from "../../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../../gateway/savings-goal.gateway";
import ExtendGoalUseCase from "../../../usecase/extend-goal/extend-goal.usecase";
import EndGoalUseCase from "../../../usecase/end-goal/end-goal.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const owner = { userId, companyId };
const month = (y: number, m: number) => new Date(Date.UTC(y, m, 1));

const gateway = (goal: SavingsGoal | null): SavingsGoalGateway => ({
  findAll: jest.fn(),
  findOwned: jest.fn().mockResolvedValue(goal),
  create: jest.fn(),
  update: jest.fn(),
});

const enduring = () =>
  SavingsGoal.create({
    ...owner,
    kind: SavingsGoalKind.ENDURING,
    targetAmountCents: 60000,
    targetMonths: 3,
    startMonth: month(2026, 6),
  });

describe("ExtendGoalUseCase", () => {
  it("extends the term of an enduring goal", async () => {
    const goal = enduring();
    const g = gateway(goal);

    const out = await new ExtendGoalUseCase(g).execute({
      ...owner,
      id: goal.id,
      targetMonths: 6,
    });

    expect(out.targetMonths).toBe(6);
    expect(goal.targetMonths).toBe(6);
    expect(g.update).toHaveBeenCalledTimes(1);
  });

  it("refuses to extend a goal that is not the person's", async () => {
    await expect(
      new ExtendGoalUseCase(gateway(null)).execute({
        ...owner,
        id: "missing",
        targetMonths: 6,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses to extend a monthly goal", async () => {
    const monthly = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.MONTHLY,
      targetAmountCents: 60000,
      startMonth: month(2026, 8),
    });

    await expect(
      new ExtendGoalUseCase(gateway(monthly)).execute({
        ...owner,
        id: monthly.id,
        targetMonths: 6,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("looks the goal up with the owner", async () => {
    const goal = enduring();
    const g = gateway(goal);

    await new ExtendGoalUseCase(g).execute({
      ...owner,
      id: goal.id,
      targetMonths: 4,
    });

    expect(g.findOwned).toHaveBeenCalledWith(owner, goal.id);
  });
});

describe("EndGoalUseCase", () => {
  it("ends a goal, keeping the optional closed reason", async () => {
    const goal = enduring();
    const g = gateway(goal);

    const out = await new EndGoalUseCase(g).execute({
      ...owner,
      id: goal.id,
      unmetReason: SavingsGoalUnmetReason.UNEXPECTED_EXPENSE,
    });

    expect(out.status).toBe(SavingsGoalStatus.ENDED);
    expect(goal.unmetReason).toBe(SavingsGoalUnmetReason.UNEXPECTED_EXPENSE);
    expect(g.update).toHaveBeenCalledTimes(1);
  });

  it("ends a goal without a reason when the person prefers not to say anything", async () => {
    const goal = enduring();

    const out = await new EndGoalUseCase(gateway(goal)).execute({
      ...owner,
      id: goal.id,
    });

    expect(out.status).toBe(SavingsGoalStatus.ENDED);
    expect(goal.unmetReason).toBeUndefined();
  });

  it("refuses to end a goal that is not the person's", async () => {
    await expect(
      new EndGoalUseCase(gateway(null)).execute({ ...owner, id: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
