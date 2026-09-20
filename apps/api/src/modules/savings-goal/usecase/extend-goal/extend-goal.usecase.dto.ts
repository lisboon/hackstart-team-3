import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface ExtendGoalUseCaseInputDto {
  userId: string;
  companyId: string;
  id: string;
  /** Novo prazo total, em meses, para a meta duradoura. */
  targetMonths: number;
}

export interface ExtendGoalUseCaseOutputDto {
  id: string;
  targetMonths: number;
}

export type ExtendGoalUseCaseInterface = BaseUseCase<
  ExtendGoalUseCaseInputDto,
  ExtendGoalUseCaseOutputDto
>;
