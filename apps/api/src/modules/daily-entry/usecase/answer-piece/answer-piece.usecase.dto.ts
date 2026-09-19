import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface AnswerPieceUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
  contentPieceId: string;
  answer: string;
}

export interface AnswerPieceUseCaseOutputDto {
  /** Sempre devolvido, qualquer que seja a escolha: a pessoa aprende vendo. */
  outcome: string;
  comprehended: boolean;
  sourceUrl: string;
}

export type AnswerPieceUseCaseInterface = BaseUseCase<
  AnswerPieceUseCaseInputDto,
  AnswerPieceUseCaseOutputDto
>;
