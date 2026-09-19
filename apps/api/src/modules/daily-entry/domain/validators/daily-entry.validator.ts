import { IsInt, IsUUID, Max, Min } from "class-validator";
import { Notification } from "@/modules/@shared/domain/entity/validators/notification";
import { ClassValidatorFields } from "@/modules/@shared/domain/entity/validators/class-validator-fields";
import type { DailyEntry } from "../daily-entry.entity";
import { HIGHEST_MOOD, LOWEST_MOOD } from "../mood";

export class DailyEntryRules {
  @IsUUID("4", { message: "Invalid userId", groups: ["create", "userId"] })
  userId: string;

  @IsUUID("4", {
    message: "Invalid companyId",
    groups: ["create", "companyId"],
  })
  companyId: string;

  @IsInt({ message: "Invalid mood", groups: ["create", "mood", "update"] })
  @Min(LOWEST_MOOD, {
    message: "Invalid mood",
    groups: ["create", "mood", "update"],
  })
  @Max(HIGHEST_MOOD, {
    message: "Invalid mood",
    groups: ["create", "mood", "update"],
  })
  mood: number;

  constructor(data: DailyEntry) {
    Object.assign(this, data.toJSON());
  }
}

export class DailyEntryValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: DailyEntry,
    fields: string[],
  ): boolean {
    const rules = new DailyEntryRules(data);
    const newFields = fields?.length ? fields : ["create"];
    return super.validate(notification, rules, newFields);
  }
}

export default class DailyEntryValidatorFactory {
  static create(): DailyEntryValidator {
    return new DailyEntryValidator();
  }
}
