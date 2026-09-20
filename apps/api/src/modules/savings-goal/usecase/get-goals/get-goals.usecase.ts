import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SelfReportSituation,
} from "@/modules/@shared/domain/enums";
import { SelfReportGateway } from "@/modules/self-report/gateway/self-report.gateway";
import {
  addMonths,
  normalizeToMonthStart,
} from "@/modules/@shared/domain/utils/month";
import { SavingsGoal } from "../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../gateway/savings-goal.gateway";
import {
  GetGoalsUseCaseInputDto,
  GetGoalsUseCaseInterface,
  GetGoalsUseCaseOutputDto,
  GoalView,
} from "./get-goals.usecase.dto";

/** Um mês fecha no azul quando sobrou ou deu exato. Nada disso é dinheiro. */
const MET_SITUATIONS: ReadonlySet<SelfReportSituation> = new Set([
  SelfReportSituation.SURPLUS,
  SelfReportSituation.BREAK_EVEN,
]);

const monthsBetween = (from: Date, to: Date): number =>
  (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
  (to.getUTCMonth() - from.getUTCMonth());

export default class GetGoalsUseCase implements GetGoalsUseCaseInterface {
  constructor(
    private readonly savingsGoalGateway: SavingsGoalGateway,
    private readonly selfReportGateway: SelfReportGateway,
  ) {}

  async execute(
    data: GetGoalsUseCaseInputDto,
  ): Promise<GetGoalsUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const currentMonth = normalizeToMonthStart(data.today);
    const goals = await this.savingsGoalGateway.findAll(owner);

    if (goals.length === 0) return { goals: [] };

    // Uma leitura só das declarações, a partir da meta mais antiga: o
    // cumprimento de cada mês sai daqui, sem uma consulta por mês.
    const earliest = goals.reduce(
      (min, goal) => (goal.startMonth < min ? goal.startMonth : min),
      goals[0].startMonth,
    );
    const reports = await this.selfReportGateway.findSince(owner, earliest);
    const metByMonth = new Set(
      reports
        .filter((report) => MET_SITUATIONS.has(report.situation))
        .map((report) => report.referenceMonth.getTime()),
    );

    const views: GoalView[] = [];
    for (const goal of goals) {
      views.push(await this.view(goal, currentMonth, metByMonth));
    }
    return { goals: views };
  }

  private async view(
    goal: SavingsGoal,
    currentMonth: Date,
    metByMonth: ReadonlySet<number>,
  ): Promise<GoalView> {
    const targetMonths =
      goal.kind === SavingsGoalKind.ENDURING ? (goal.targetMonths ?? 1) : 1;

    // Os meses do prazo que já passaram (inclui o corrente). Meses futuros não
    // contam: a meta espera, sem punir o que ainda não aconteceu.
    const elapsed = Math.min(
      targetMonths,
      monthsBetween(goal.startMonth, currentMonth) + 1,
    );

    let monthsMet = 0;
    for (let i = 0; i < elapsed; i += 1) {
      if (metByMonth.has(addMonths(goal.startMonth, i).getTime())) {
        monthsMet += 1;
      }
    }

    const currentWithinTerm =
      monthsBetween(goal.startMonth, currentMonth) >= 0 &&
      monthsBetween(goal.startMonth, currentMonth) < targetMonths;
    const currentMonthMet =
      currentWithinTerm && metByMonth.has(currentMonth.getTime());

    // Cumprida quando todos os meses do prazo fecharam no azul. Persiste o
    // estado para não recalcular indefinidamente uma meta já batida.
    if (goal.isActive && monthsMet >= targetMonths) {
      goal.markMet();
      await this.savingsGoalGateway.update(goal);
    }

    const lastTermMonth = addMonths(goal.startMonth, targetMonths - 1);
    const termEndedUnmet =
      goal.status === SavingsGoalStatus.ACTIVE &&
      currentMonth > lastTermMonth &&
      monthsMet < targetMonths;

    return {
      id: goal.id,
      kind: goal.kind,
      status: goal.status,
      startMonth: goal.startMonth,
      targetAmountCents: goal.targetAmountCents,
      monthlyTargetCents: goal.monthlyTargetCents,
      targetMonths,
      monthsMet,
      currentMonthMet,
      termEndedUnmet,
    };
  }
}
