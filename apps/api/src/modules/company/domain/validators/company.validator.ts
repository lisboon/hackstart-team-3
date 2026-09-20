import {
  Length,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Notification } from "@/modules/@shared/domain/entity/validators/notification";
import { ClassValidatorFields } from "@/modules/@shared/domain/entity/validators/class-validator-fields";
import { isValidTimeZone } from "../journey-window";
import { Company } from "../company.entity";

/**
 * Não há decorador pronto para fuso IANA, e não existe lista para comparar: a
 * verificação é pedir a `Intl` e ver se ela aceita.
 */
@ValidatorConstraint({ name: "isIanaTimeZone" })
export class IsIanaTimeZone implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "string" && isValidTimeZone(value);
  }
}

export class CompanyRules {
  @Length(2, 120, {
    message: "Invalid name",
    groups: ["create", "name", "update"],
  })
  name: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Invalid slug",
    groups: ["create", "slug", "update"],
  })
  slug: string;

  @Validate(IsIanaTimeZone, {
    message: "Invalid journeyZone",
    groups: ["create", "journeyZone", "update"],
  })
  journeyZone: string;

  constructor(data: Company) {
    Object.assign(this, data.toJSON());
  }
}

export class CompanyValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: Company,
    fields: string[],
  ): boolean {
    const rules = new CompanyRules(data);
    const newFields = fields?.length ? fields : ["create"];
    return super.validate(notification, rules, newFields);
  }
}

export default class CompanyValidatorFactory {
  static create(): CompanyValidator {
    return new CompanyValidator();
  }
}
