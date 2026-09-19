import { IsEnum, IsUUID } from "class-validator";
import { Notification } from "@/modules/@shared/domain/entity/validators/notification";
import { ClassValidatorFields } from "@/modules/@shared/domain/entity/validators/class-validator-fields";
import { SelfReportSituation } from "@/modules/@shared/domain/enums";
import { SelfReport } from "../self-report.entity";

export class SelfReportRules {
  @IsUUID("4", {
    message: "Invalid userId",
    groups: ["create", "userId"],
  })
  userId: string;

  @IsUUID("4", {
    message: "Invalid companyId",
    groups: ["create", "companyId"],
  })
  companyId: string;

  @IsEnum(SelfReportSituation, {
    message: "Invalid situation",
    groups: ["create", "situation", "update"],
  })
  situation: SelfReportSituation;

  constructor(data: SelfReport) {
    Object.assign(this, data.toJSON());
  }
}

export class SelfReportValidator extends ClassValidatorFields {
  validate(
    notification: Notification,
    data: SelfReport,
    fields: string[],
  ): boolean {
    const rules = new SelfReportRules(data);
    const newFields = fields?.length ? fields : ["create"];
    return super.validate(notification, rules, newFields);
  }
}

export default class SelfReportValidatorFactory {
  static create(): SelfReportValidator {
    return new SelfReportValidator();
  }
}
