import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { Notification } from "@/modules/@shared/domain/entity/validators/notification";
import { ClassValidatorFields } from "@/modules/@shared/domain/entity/validators/class-validator-fields";
import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SavingsGoalUnmetReason,
} from "@/modules/@shared/domain/enums";
import { SavingsGoal } from "../savings-goal.entity";

/** Um horizonte razoável para uma meta de guarda: de 2 a 36 meses. */
export const MIN_TARGET_MONTHS = 2;
export const MAX_TARGET_MONTHS = 36;

export class SavingsGoalRules {
  @IsUUID("4", { message: "Invalid userId", groups: ["create", "userId"] })
  userId: string;

  @IsUUID("4", {
    message: "Invalid companyId",
    groups: ["create", "companyId"],
  })
  companyId: string;

  @IsEnum(SavingsGoalKind, {
    message: "Invalid kind",
    groups: ["create", "kind"],
  })
  kind: SavingsGoalKind;

  @IsInt({
    message: "Invalid targetAmountCents",
    groups: ["create", "targetAmountCents", "update"],
  })
  @Min(1, {
    message: "Invalid targetAmountCents",
    groups: ["create", "targetAmountCents", "update"],
  })
  targetAmountCents: number;

  @IsOptional({ groups: ["create", "targetMonths", "update"] })
  @IsInt({
    message: "Invalid targetMonths",
    groups: ["create", "targetMonths", "update"],
  })
  @Min(MIN_TARGET_MONTHS, {
    message: "Invalid targetMonths",
    groups: ["create", "targetMonths", "update"],
  })
  @Max(MAX_TARGET_MONTHS, {
    message: "Invalid targetMonths",
    groups: ["create", "targetMonths", "update"],
  })
  targetMonths?: number;

  @IsEnum(SavingsGoalStatus, {
    message: "Invalid status",
    groups: ["create", "status"],
  })
  status: SavingsGoalStatus;

  @IsOptional({ groups: ["create", "unmetReason"] })
  @IsEnum(SavingsGoalUnmetReason, {
    message: "Invalid unmetReason",
    groups: ["create", "unmetReason"],
  })
  unmetReason?: SavingsGoalUnmetReason;

  constructor(data: SavingsGoal) {
    Object.assign(this, data.toJSON());
  }
}

export class SavingsGoalValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: SavingsGoal,
    fields: string[],
  ): boolean {
    const rules = new SavingsGoalRules(data);
    const newFields = fields?.length ? fields : ["create"];
    return super.validate(notification, rules, newFields);
  }
}

export default class SavingsGoalValidatorFactory {
  static create(): SavingsGoalValidator {
    return new SavingsGoalValidator();
  }
}
