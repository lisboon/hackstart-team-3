import { CompanyGateway } from "../../gateway/company.gateway";
import { Company } from "../../domain/company.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { describeShifts } from "../../domain/journey-window";
import {
  FindCompanyByIdUseCaseInputDto,
  FindCompanyByIdUseCaseInterface,
  FindCompanyByIdUseCaseOutputDto,
} from "./find-by-id.usecase.dto";

export default class FindCompanyByIdUseCase implements FindCompanyByIdUseCaseInterface {
  constructor(private readonly companyGateway: CompanyGateway) {}

  async execute(
    data: FindCompanyByIdUseCaseInputDto,
  ): Promise<FindCompanyByIdUseCaseOutputDto> {
    const company = await this.companyGateway.findById(data.id);
    if (!company) {
      throw new NotFoundError(data.id, Company);
    }

    // Sem faixa própria a unidade roda no padrão do processo, e a tela mostra
    // a lista vazia — que é a verdade: não há configuração desta unidade.
    const [window, journeyExceptions] = await Promise.all([
      this.companyGateway.findJourneyWindow(data.id),
      this.companyGateway.findJourneyExceptions(data.id),
    ]);

    return {
      ...company.toJSON(),
      journeyShifts: describeShifts(window?.shifts ?? []),
      journeyExceptions,
    };
  }
}
