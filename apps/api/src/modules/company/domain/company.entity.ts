import BaseEntity from "@/modules/@shared/domain/entity/base.entity";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { normalizeSlug } from "@/modules/@shared/domain/utils/slug";
import { DEFAULT_JOURNEY_WINDOW } from "./journey-window";
import CompanyValidatorFactory from "./validators/company.validator";

export interface CompanyProps {
  id?: string;
  name: string;
  slug: string;
  active?: boolean;
  /** Fuso da unidade. As faixas da janela vivem em tabela própria. */
  journeyZone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Company extends BaseEntity {
  private _name: string;
  private _slug: string;
  private _journeyZone: string;

  constructor(props: CompanyProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._name = props.name;
    this._slug = normalizeSlug(props.slug);
    this._journeyZone = props.journeyZone ?? DEFAULT_JOURNEY_WINDOW.zone;
  }

  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  get journeyZone(): string {
    return this._journeyZone;
  }

  changeName(name: string): void {
    this._name = name;
  }

  changeSlug(slug: string): void {
    this._slug = normalizeSlug(slug);
  }

  changeJourneyZone(zone: string): void {
    this._journeyZone = zone;
  }

  updateCompany(
    props: Partial<Pick<CompanyProps, "name" | "slug" | "journeyZone">>,
  ): void {
    if (props.name !== undefined) this.changeName(props.name);
    if (props.slug !== undefined) this.changeSlug(props.slug);
    if (props.journeyZone !== undefined) {
      this.changeJourneyZone(props.journeyZone);
    }

    this.update();
    this.validate(["update"]);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = CompanyValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ["create"]);
  }

  static create(props: CompanyProps): Company {
    const company = new Company(props);
    company.validate();

    if (company.notification.hasErrors()) {
      throw new EntityValidationError(company.notification.toJSON());
    }

    return company;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      slug: this._slug,
      active: this._active,
      journeyZone: this._journeyZone,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
