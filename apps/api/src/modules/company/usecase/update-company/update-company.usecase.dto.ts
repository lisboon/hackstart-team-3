import BaseUseCase from "@/modules/@shared/usecase/base.usecase";
import { JourneyShiftView } from "../../domain/journey-window";

export interface UpdateCompanyUseCaseInputDto {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  journeyZone?: string;
  /** Substitui as faixas inteiras. Omitir mantém as que já existem. */
  journeyShifts?: JourneyShiftView[];
}

export interface UpdateCompanyUseCaseOutputDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  journeyZone: string;
  journeyShifts: JourneyShiftView[];
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
