import { Inject, Injectable } from "@nestjs/common";
import CompanyFacade from "@/modules/company/facade/company.facade";
import {
  FindCompanyByIdFacadeInputDto,
  UpdateCompanyFacadeInputDto,
  UnitIndicatorsFacadeInputDto,
} from "@/modules/company/facade/company.facade.dto";

@Injectable()
export class CompanyService {
  @Inject(CompanyFacade)
  private readonly companyFacade: CompanyFacade;

  async findById(input: FindCompanyByIdFacadeInputDto) {
    return this.companyFacade.findById(input);
  }

  async update(input: UpdateCompanyFacadeInputDto) {
    return this.companyFacade.update(input);
  }

  async indicators(input: UnitIndicatorsFacadeInputDto) {
    return this.companyFacade.indicators(input);
  }
}
