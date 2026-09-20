import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { SavingsGoal } from "../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../gateway/savings-goal.gateway";
import {
  ExtendGoalUseCaseInputDto,
  ExtendGoalUseCaseInterface,
  ExtendGoalUseCaseOutputDto,
} from "./extend-goal.usecase.dto";

export default class ExtendGoalUseCase implements ExtendGoalUseCaseInterface {
  constructor(private readonly savingsGoalGateway: SavingsGoalGateway) {}

  async execute(
    data: ExtendGoalUseCaseInputDto,
  ): Promise<ExtendGoalUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const goal = await this.savingsGoalGateway.findOwned(owner, data.id);
    if (!goal) {
      throw new NotFoundError(data.id, SavingsGoal);
    }

    // A entidade recusa estender o que não é duradouro ou não está ativo.
    goal.extend(data.targetMonths);
    await this.savingsGoalGateway.update(goal);

    return {
      id: goal.id,
      targetMonths: goal.targetMonths ?? data.targetMonths,
    };
  }
}
