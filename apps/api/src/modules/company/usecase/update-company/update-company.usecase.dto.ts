import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import {
  JourneyExceptionView,
  JourneyShiftView,
} from "../../domain/journey-window";

export interface UpdateCompanyUseCaseInputDto {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  journeyZone?: string;
  /** Substitui as faixas inteiras. Omitir mantém as que já existem. */
  journeyShifts?: JourneyShiftView[];
  /** Substitui os dias sem expediente inteiros. Omitir mantém os que existem. */
  journeyExceptions?: JourneyExceptionView[];
}

export interface UpdateCompanyUseCaseOutputDto {
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

export interface UpdateCompanyUseCaseInterface extends BaseUseCase<
  UpdateCompanyUseCaseInputDto,
  UpdateCompanyUseCaseOutputDto
> {
  execute(
    data: UpdateCompanyUseCaseInputDto,
  ): Promise<UpdateCompanyUseCaseOutputDto>;
}
