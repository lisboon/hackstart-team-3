import { Inject, Injectable } from "@nestjs/common";
import SavingsGoalFacade from "@/modules/savings-goal/facade/savings-goal.facade";
import {
  CreateGoalFacadeInputDto,
  EndGoalFacadeInputDto,
  ExtendGoalFacadeInputDto,
  GetGoalsFacadeInputDto,
} from "@/modules/savings-goal/facade/savings-goal.facade.dto";

@Injectable()
export class SavingsGoalService {
  @Inject(SavingsGoalFacade)
  private readonly savingsGoalFacade: SavingsGoalFacade;

  async create(input: CreateGoalFacadeInputDto) {
    return this.savingsGoalFacade.create(input);
  }

  async getGoals(input: GetGoalsFacadeInputDto) {
    return this.savingsGoalFacade.getGoals(input);
  }

  async extend(input: ExtendGoalFacadeInputDto) {
    return this.savingsGoalFacade.extend(input);
  }

  async end(input: EndGoalFacadeInputDto) {
    return this.savingsGoalFacade.end(input);
  }
}
