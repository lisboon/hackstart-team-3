import { CompanyGateway } from "../../gateway/company.gateway";
import { Company } from "../../domain/company.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { normalizeSlug } from "@/modules/@shared/domain/utils/slug";
import {
  JourneyShift,
  JourneyShiftView,
  MINUTES_IN_DAY,
  describeShifts,
  minutesFromClock,
} from "../../domain/journey-window";
import {
  UpdateCompanyUseCaseInputDto,
  UpdateCompanyUseCaseInterface,
  UpdateCompanyUseCaseOutputDto,
} from "./update-company.usecase.dto";

const invalidShift = (index: number, message: string) =>
  new EntityValidationError([{ field: `journeyShifts.${index}`, message }]);

export default class UpdateCompanyUseCase implements UpdateCompanyUseCaseInterface {
  constructor(private readonly companyGateway: CompanyGateway) {}

  async execute(
    data: UpdateCompanyUseCaseInputDto,
  ): Promise<UpdateCompanyUseCaseOutputDto> {
    const company = await this.companyGateway.findById(data.id);
    if (!company) {
      throw new NotFoundError(data.id, Company);
    }

    if (data.slug !== undefined && normalizeSlug(data.slug) !== company.slug) {
      const existing = await this.companyGateway.findBySlug(
        normalizeSlug(data.slug),
      );
      if (existing && existing.id !== company.id) {
        throw new EntityValidationError([
          { field: "slug", message: "Slug already in use" },
        ]);
      }
    }

    // As faixas são traduzidas antes de qualquer escrita: uma hora inválida no
    // meio da lista não pode deixar a unidade com meia janela gravada.
    const shifts =
      data.journeyShifts === undefined
        ? undefined
        : this.toShifts(data.journeyShifts);

    company.updateCompany({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.journeyZone !== undefined && { journeyZone: data.journeyZone }),
    });

    if (data.active === true) {
      company.activate();
    }
    if (data.active === false) {
      company.deactivate();
    }

    await this.companyGateway.update(company);
    if (shifts !== undefined) {
      await this.companyGateway.replaceJourneyShifts(company.id, shifts);
    }

    const window = await this.companyGateway.findJourneyWindow(company.id);

    return {
      ...company.toJSON(),
      journeyShifts: describeShifts(window?.shifts ?? []),
    };
  }

  private toShifts(views: JourneyShiftView[]): JourneyShift[] {
    return views.map((view, index) => {
      if (
        !Number.isInteger(view.weekday) ||
        view.weekday < 0 ||
        view.weekday > 6
      ) {
        throw invalidShift(index, "Invalid weekday");
      }

      const opensAt = minutesFromClock(view.opensAt);
      const closesAt = minutesFromClock(view.closesAt);
      if (opensAt === null || closesAt === null) {
        throw invalidShift(index, "Invalid time of day");
      }
      // Uma faixa que fecha antes de abrir não é turno da noite: turno da noite
      // são duas faixas, em dias diferentes. Aqui seria só engano.
      if (opensAt >= closesAt || opensAt >= MINUTES_IN_DAY) {
        throw invalidShift(index, "A shift must open before it closes");
      }

      return { weekday: view.weekday, opensAt, closesAt };
    });
  }
}
