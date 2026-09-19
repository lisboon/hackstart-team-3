import { FindCompanyByIdUseCaseInputDto } from "../usecase/find-by-id/find-by-id.usecase.dto";
import {
  UpdateCompanyUseCaseInputDto,
  UpdateCompanyUseCaseOutputDto,
} from "../usecase/update-company/update-company.usecase.dto";

export type FindCompanyByIdFacadeInputDto = FindCompanyByIdUseCaseInputDto;
export interface FindCompanyByIdFacadeOutputDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type UpdateCompanyFacadeInputDto = UpdateCompanyUseCaseInputDto;
export type UpdateCompanyFacadeOutputDto = UpdateCompanyUseCaseOutputDto;

export interface CompanyFacadeInterface {
  findById(
    data: FindCompanyByIdFacadeInputDto,
  ): Promise<FindCompanyByIdFacadeOutputDto>;
  update(
    data: UpdateCompanyFacadeInputDto,
  ): Promise<UpdateCompanyFacadeOutputDto>;
}
