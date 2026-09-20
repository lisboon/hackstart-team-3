import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { SavingsGoal } from "../../domain/savings-goal.entity";
import { SavingsGoalGateway } from "../../gateway/savings-goal.gateway";
import {
  EndGoalUseCaseInputDto,
  EndGoalUseCaseInterface,
  EndGoalUseCaseOutputDto,
} from "./end-goal.usecase.dto";

export default class EndGoalUseCase implements EndGoalUseCaseInterface {
  constructor(private readonly savingsGoalGateway: SavingsGoalGateway) {}

  async execute(
    data: EndGoalUseCaseInputDto,
  ): Promise<EndGoalUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const goal = await this.savingsGoalGateway.findOwned(owner, data.id);
    if (!goal) {
      throw new NotFoundError(data.id, SavingsGoal);
    }

    goal.end(data.unmetReason);
    await this.savingsGoalGateway.update(goal);

    return { id: goal.id, status: goal.status };
  }
}
