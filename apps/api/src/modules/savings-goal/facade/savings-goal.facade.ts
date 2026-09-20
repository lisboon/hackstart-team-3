import { CreateGoalUseCaseInterface } from "../usecase/create-goal/create-goal.usecase.dto";
import { GetGoalsUseCaseInterface } from "../usecase/get-goals/get-goals.usecase.dto";
import { ExtendGoalUseCaseInterface } from "../usecase/extend-goal/extend-goal.usecase.dto";
import { EndGoalUseCaseInterface } from "../usecase/end-goal/end-goal.usecase.dto";
import {
  CreateGoalFacadeInputDto,
  CreateGoalFacadeOutputDto,
  EndGoalFacadeInputDto,
  EndGoalFacadeOutputDto,
  ExtendGoalFacadeInputDto,
  ExtendGoalFacadeOutputDto,
  GetGoalsFacadeInputDto,
  GetGoalsFacadeOutputDto,
  SavingsGoalFacadeInterface,
} from "./savings-goal.facade.dto";

export default class SavingsGoalFacade implements SavingsGoalFacadeInterface {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCaseInterface,
    private readonly getGoalsUseCase: GetGoalsUseCaseInterface,
    private readonly extendGoalUseCase: ExtendGoalUseCaseInterface,
    private readonly endGoalUseCase: EndGoalUseCaseInterface,
  ) {}

  async create(
    data: CreateGoalFacadeInputDto,
  ): Promise<CreateGoalFacadeOutputDto> {
    return this.createGoalUseCase.execute(data);
  }

  async getGoals(
    data: GetGoalsFacadeInputDto,
  ): Promise<GetGoalsFacadeOutputDto> {
    return this.getGoalsUseCase.execute(data);
  }

  async extend(
    data: ExtendGoalFacadeInputDto,
  ): Promise<ExtendGoalFacadeOutputDto> {
    return this.extendGoalUseCase.execute(data);
  }

  async end(data: EndGoalFacadeInputDto): Promise<EndGoalFacadeOutputDto> {
    return this.endGoalUseCase.execute(data);
  }
}
