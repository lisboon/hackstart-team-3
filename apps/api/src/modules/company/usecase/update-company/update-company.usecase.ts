import { CompanyGateway } from "../../gateway/company.gateway";
import { Company } from "../../domain/company.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { normalizeSlug } from "@/modules/@shared/domain/utils/slug";
import {
  JourneyExceptionView,
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

const invalidException = (index: number, message: string) =>
  new EntityValidationError([{ field: `journeyExceptions.${index}`, message }]);

/** `YYYY-MM-DD`, e um dia que existe no calendário. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

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
    const exceptions =
      data.journeyExceptions === undefined
        ? undefined
        : this.toExceptions(data.journeyExceptions);

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
    if (exceptions !== undefined) {
      await this.companyGateway.replaceJourneyExceptions(
        company.id,
        exceptions,
      );
    }

    const [window, journeyExceptions] = await Promise.all([
      this.companyGateway.findJourneyWindow(company.id),
      this.companyGateway.findJourneyExceptions(company.id),
    ]);

    return {
      ...company.toJSON(),
      journeyShifts: describeShifts(window?.shifts ?? []),
      journeyExceptions,
    };
  }

  /**
   * Feriado, ponto facultativo, recesso, parada de fábrica. O motivo é texto
   * porque a lista é da unidade: um enum nosso decidiria por ela o que pode
   * fechar a fábrica.
   */
  private toExceptions(views: JourneyExceptionView[]): JourneyExceptionView[] {
    return views.map((view, index) => {
      if (!CALENDAR_DAY.test(view.date)) {
        throw invalidException(index, "Invalid date");
      }
      // A expressão aceita 2026-02-31; o calendário não. `Date` normaliza em
      // silêncio, então a volta é que prova.
      const parsed = new Date(`${view.date}T00:00:00.000Z`);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== view.date
      ) {
        throw invalidException(index, "Invalid date");
      }
      const reason = view.reason.trim();
      if (reason.length === 0) {
        throw invalidException(index, "A reason is required");
      }
      return { date: view.date, reason };
    });
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
