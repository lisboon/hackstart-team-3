import prisma from "@/infra/database/prisma.instance";
import CompanyRepository from "../repository/company.repository";
import FindCompanyByIdUseCase from "../usecase/find-by-id/find-by-id.usecase";
import UpdateCompanyUseCase from "../usecase/update-company/update-company.usecase";
import CompanyFacade from "../facade/company.facade";

export default class CompanyFacadeFactory {
  static create(): CompanyFacade {
    const companyRepository = new CompanyRepository(prisma);
    return new CompanyFacade(
      new FindCompanyByIdUseCase(companyRepository),
      new UpdateCompanyUseCase(companyRepository),
    );
  }
}
