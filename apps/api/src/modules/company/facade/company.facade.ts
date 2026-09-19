import { FindCompanyByIdUseCaseInterface } from "../usecase/find-by-id/find-by-id.usecase.dto";
import { UpdateCompanyUseCaseInterface } from "../usecase/update-company/update-company.usecase.dto";
import {
  CompanyFacadeInterface,
  FindCompanyByIdFacadeInputDto,
  FindCompanyByIdFacadeOutputDto,
  UpdateCompanyFacadeInputDto,
  UpdateCompanyFacadeOutputDto,
} from "./company.facade.dto";

export default class CompanyFacade implements CompanyFacadeInterface {
  constructor(
    private readonly findCompanyByIdUseCase: FindCompanyByIdUseCaseInterface,
    private readonly updateCompanyUseCase: UpdateCompanyUseCaseInterface,
  ) {}

  async findById(
    data: FindCompanyByIdFacadeInputDto,
  ): Promise<FindCompanyByIdFacadeOutputDto> {
    const company = await this.findCompanyByIdUseCase.execute(data);
    return company.toJSON();
  }

  async update(
    data: UpdateCompanyFacadeInputDto,
  ): Promise<UpdateCompanyFacadeOutputDto> {
    return this.updateCompanyUseCase.execute(data);
  }
}
