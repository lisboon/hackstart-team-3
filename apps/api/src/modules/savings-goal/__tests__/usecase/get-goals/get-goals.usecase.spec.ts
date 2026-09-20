import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SelfReportSituation,
} from "@/modules/@shared/domain/enums";
import { SelfReport } from "@/modules/self-report/domain/self-report.entity";
import { SelfReportGateway } from "@/modules/self-report/gateway/self-report.gateway";
import { SavingsGoal } from "../../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../../gateway/savings-goal.gateway";
import GetGoalsUseCase from "../../../usecase/get-goals/get-goals.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const owner = { userId, companyId };

const month = (y: number, m: number) => new Date(Date.UTC(y, m, 1));

const report = (y: number, m: number, situation: SelfReportSituation) =>
  SelfReport.create({
    userId,
    companyId,
    referenceMonth: month(y, m),
    situation,
  });

const savingsGateway = (goals: SavingsGoal[]): SavingsGoalGateway => ({
  findAll: jest.fn().mockResolvedValue(goals),
  findOwned: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

const reportGateway = (reports: SelfReport[]): SelfReportGateway => ({
  findByMonth: jest.fn(),
  findSince: jest.fn().mockResolvedValue(reports),
  create: jest.fn(),
  update: jest.fn(),
});

describe("GetGoalsUseCase", () => {
  it("returns nothing when the person has no goals", async () => {
    const out = await new GetGoalsUseCase(
      savingsGateway([]),
      reportGateway([]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    expect(out.goals).toEqual([]);
  });

  it("counts the current month as met for a monthly goal that closed in the blue", async () => {
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.MONTHLY,
      startMonth: month(2026, 8),
    });
    const goals = savingsGateway([goal]);

    const out = await new GetGoalsUseCase(
      goals,
      reportGateway([report(2026, 8, SelfReportSituation.SURPLUS)]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    const view = out.goals[0];
    expect(view.targetMonths).toBe(1);
    expect(view.monthsMet).toBe(1);
    expect(view.currentMonthMet).toBe(true);
    // Meta mensal cumprida vira MET e persiste.
    expect(view.status).toBe(SavingsGoalStatus.MET);
    expect(goals.update).toHaveBeenCalledTimes(1);
  });

  it("does not count a month that fell short", async () => {
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.MONTHLY,
      startMonth: month(2026, 8),
    });

    const out = await new GetGoalsUseCase(
      savingsGateway([goal]),
      reportGateway([report(2026, 8, SelfReportSituation.SLIGHT_SHORTFALL)]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    expect(out.goals[0].monthsMet).toBe(0);
    expect(out.goals[0].currentMonthMet).toBe(false);
    expect(out.goals[0].status).toBe(SavingsGoalStatus.ACTIVE);
  });

  it("shows X of N for an enduring goal, counting only the months that closed", async () => {
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.ENDURING,
      targetMonths: 6,
      startMonth: month(2026, 6),
    });

    // Julho e agosto no azul; setembro (corrente) apertado.
    const out = await new GetGoalsUseCase(
      savingsGateway([goal]),
      reportGateway([
        report(2026, 6, SelfReportSituation.SURPLUS),
        report(2026, 7, SelfReportSituation.BREAK_EVEN),
        report(2026, 8, SelfReportSituation.SEVERE_SHORTFALL),
      ]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    const view = out.goals[0];
    expect(view.targetMonths).toBe(6);
    expect(view.monthsMet).toBe(2);
    expect(view.currentMonthMet).toBe(false);
    // Ainda dentro do prazo (mês 3 de 6): não é fim de prazo.
    expect(view.termEndedUnmet).toBe(false);
    expect(view.status).toBe(SavingsGoalStatus.ACTIVE);
  });

  it("marks an enduring goal MET when every month of the term closed in the blue", async () => {
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.ENDURING,
      targetMonths: 2,
      startMonth: month(2026, 7),
    });
    const goals = savingsGateway([goal]);

    const out = await new GetGoalsUseCase(
      goals,
      reportGateway([
        report(2026, 7, SelfReportSituation.SURPLUS),
        report(2026, 8, SelfReportSituation.SURPLUS),
      ]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    expect(out.goals[0].monthsMet).toBe(2);
    expect(out.goals[0].status).toBe(SavingsGoalStatus.MET);
    expect(goals.update).toHaveBeenCalledTimes(1);
  });

  it("flags an ended term that was not met, without punishing", async () => {
    // Prazo de 2 meses (jul, ago); estamos em setembro e só um mês fechou.
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.ENDURING,
      targetMonths: 2,
      startMonth: month(2026, 6),
    });

    const out = await new GetGoalsUseCase(
      savingsGateway([goal]),
      reportGateway([report(2026, 6, SelfReportSituation.SURPLUS)]),
    ).execute({ userId, companyId, today: month(2026, 8) });

    const view = out.goals[0];
    expect(view.monthsMet).toBe(1);
    expect(view.termEndedUnmet).toBe(true);
    // Não zera nem vira erro: continua ACTIVE, esperando estender ou encerrar.
    expect(view.status).toBe(SavingsGoalStatus.ACTIVE);
  });

  it("reads goals and reports with owner (userId + companyId)", async () => {
    const goal = SavingsGoal.create({
      ...owner,
      kind: SavingsGoalKind.MONTHLY,
      startMonth: month(2026, 8),
    });
    const goals = savingsGateway([goal]);
    const reports = reportGateway([]);

    await new GetGoalsUseCase(goals, reports).execute({
      userId,
      companyId,
      today: month(2026, 8),
    });

    expect(goals.findAll).toHaveBeenCalledWith(owner);
    expect(reports.findSince).toHaveBeenCalledWith(owner, expect.any(Date));
  });
});
