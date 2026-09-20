import {
  CreateGoalUseCaseInputDto,
  CreateGoalUseCaseOutputDto,
} from "../usecase/create-goal/create-goal.usecase.dto";
import {
  GetGoalsUseCaseInputDto,
  GetGoalsUseCaseOutputDto,
} from "../usecase/get-goals/get-goals.usecase.dto";
import {
  ExtendGoalUseCaseInputDto,
  ExtendGoalUseCaseOutputDto,
} from "../usecase/extend-goal/extend-goal.usecase.dto";
import {
  EndGoalUseCaseInputDto,
  EndGoalUseCaseOutputDto,
} from "../usecase/end-goal/end-goal.usecase.dto";

export type CreateGoalFacadeInputDto = CreateGoalUseCaseInputDto;
export type CreateGoalFacadeOutputDto = CreateGoalUseCaseOutputDto;
export type GetGoalsFacadeInputDto = GetGoalsUseCaseInputDto;
export type GetGoalsFacadeOutputDto = GetGoalsUseCaseOutputDto;
export type ExtendGoalFacadeInputDto = ExtendGoalUseCaseInputDto;
export type ExtendGoalFacadeOutputDto = ExtendGoalUseCaseOutputDto;
export type EndGoalFacadeInputDto = EndGoalUseCaseInputDto;
export type EndGoalFacadeOutputDto = EndGoalUseCaseOutputDto;

export interface SavingsGoalFacadeInterface {
  create(data: CreateGoalFacadeInputDto): Promise<CreateGoalFacadeOutputDto>;
  getGoals(data: GetGoalsFacadeInputDto): Promise<GetGoalsFacadeOutputDto>;
  extend(data: ExtendGoalFacadeInputDto): Promise<ExtendGoalFacadeOutputDto>;
  end(data: EndGoalFacadeInputDto): Promise<EndGoalFacadeOutputDto>;
}
