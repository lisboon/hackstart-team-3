import BaseEntity from "@/modules/@shared/domain/entity/base.entity";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import {
  SELF_REPORT_SCORE,
  SelfReportSituation,
} from "@/modules/@shared/domain/enums";
import { normalizeToMonthStart } from "@/modules/@shared/domain/utils/month";
import SelfReportValidatorFactory from "./validators/self-report.validator";

export interface SelfReportProps {
  id?: string;
  userId: string;
  companyId: string;
  referenceMonth: Date;
  situation: SelfReportSituation;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class SelfReport extends BaseEntity {
  private _userId: string;
  private _companyId: string;
  private _referenceMonth: Date;
  private _situation: SelfReportSituation;

  constructor(props: SelfReportProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._userId = props.userId;
    this._companyId = props.companyId;
    this._referenceMonth = normalizeToMonthStart(props.referenceMonth);
    this._situation = props.situation;
  }

  get userId(): string {
    return this._userId;
  }

  get companyId(): string {
    return this._companyId;
  }

  get referenceMonth(): Date {
    return this._referenceMonth;
  }

  get situation(): SelfReportSituation {
    return this._situation;
  }

  get score(): number {
    return SELF_REPORT_SCORE[this._situation];
  }

  changeSituation(situation: SelfReportSituation): void {
    this._situation = situation;
    this.update();
    this.validate(["update"]);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = SelfReportValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ["create"]);
  }

  static create(props: SelfReportProps): SelfReport {
    const selfReport = new SelfReport(props);
    selfReport.validate();

    if (selfReport.notification.hasErrors()) {
      throw new EntityValidationError(selfReport.notification.toJSON());
    }

    return selfReport;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      companyId: this._companyId,
      referenceMonth: this._referenceMonth,
      situation: this._situation,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
