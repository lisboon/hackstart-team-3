import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import {
  JourneyExceptionView,
  JourneyShiftView,
} from "../../domain/journey-window";

export interface FindCompanyByIdUseCaseInputDto {
  id: string;
}

/**
 * A organização como a tela do gestor precisa dela: os dados da unidade mais a
 * janela de escrita, para ele conferir e ajustar o que gravou.
 */
export interface FindCompanyByIdUseCaseOutputDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  journeyZone: string;
  journeyShifts: JourneyShiftView[];
  journeyExceptions: JourneyExceptionView[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface FindCompanyByIdUseCaseInterface extends BaseUseCase<
  FindCompanyByIdUseCaseInputDto,
  FindCompanyByIdUseCaseOutputDto
> {
  execute(
    data: FindCompanyByIdUseCaseInputDto,
  ): Promise<FindCompanyByIdUseCaseOutputDto>;
}
