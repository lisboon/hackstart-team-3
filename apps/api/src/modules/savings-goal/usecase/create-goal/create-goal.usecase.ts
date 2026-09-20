import { normalizeToMonthStart } from "@/modules/@shared/domain/utils/month";
import { SavingsGoal } from "../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../gateway/savings-goal.gateway";
import {
  CreateGoalUseCaseInputDto,
  CreateGoalUseCaseInterface,
  CreateGoalUseCaseOutputDto,
} from "./create-goal.usecase.dto";

export default class CreateGoalUseCase implements CreateGoalUseCaseInterface {
  constructor(private readonly savingsGoalGateway: SavingsGoalGateway) {}

  async execute(
    data: CreateGoalUseCaseInputDto,
  ): Promise<CreateGoalUseCaseOutputDto> {
    // O mês de início é o do relógio do servidor. Múltiplas metas ativas
    // convivem, então não há checagem de meta única: a pessoa pode ter uma
    // mensal e uma duradoura ao mesmo tempo.
    const startMonth = normalizeToMonthStart(data.today);

    const goal = SavingsGoal.create({
      userId: data.userId,
      companyId: data.companyId,
      kind: data.kind,
      targetAmountCents: data.targetAmountCents,
      targetMonths: data.targetMonths,
      startMonth,
    });

    await this.savingsGoalGateway.create(goal);

    return {
      id: goal.id,
      kind: goal.kind,
      targetAmountCents: goal.targetAmountCents,
      targetMonths: goal.targetMonths ?? null,
      startMonth: goal.startMonth,
    };
  }
}
