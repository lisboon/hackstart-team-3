import BaseEntity from "@/modules/@shared/domain/entity/base.entity";
import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import DailyEntryValidatorFactory from "./validators/daily-entry.validator";

export interface DailyEntryProps {
  id?: string;
  userId: string;
  companyId: string;
  entryDate: Date;
  mood: number;
  contentPieceId?: string;
  answer?: string;
  comprehended?: boolean;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class DailyEntry extends BaseEntity {
  private _userId: string;
  private _companyId: string;
  private _entryDate: Date;
  private _mood: number;
  private _contentPieceId: string | undefined;
  private _answer: string | undefined;
  private _comprehended: boolean | undefined;

  constructor(props: DailyEntryProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._userId = props.userId;
    this._companyId = props.companyId;
    this._entryDate = normalizeToDayStart(props.entryDate);
    this._mood = props.mood;
    this._contentPieceId = props.contentPieceId;
    this._answer = props.answer;
    this._comprehended = props.comprehended;
  }

  get userId(): string {
    return this._userId;
  }

  get companyId(): string {
    return this._companyId;
  }

  get entryDate(): Date {
    return this._entryDate;
  }

  get mood(): number {
    return this._mood;
  }

  get contentPieceId(): string | undefined {
    return this._contentPieceId;
  }

  get answer(): string | undefined {
    return this._answer;
  }

  get comprehended(): boolean | undefined {
    return this._comprehended;
  }

  get pieceAnswered(): boolean {
    return this._answer !== undefined && this._answer !== null;
  }

  /**
   * Uma resposta por dia, como o humor. A consequência da escolha é sempre
   * mostrada; `comprehended` só registra se a escolha foi coerente com o que
   * a peça ensinou, e não cumprida não vira erro em lugar nenhum.
   */
  answerPiece(
    contentPieceId: string,
    answer: string,
    comprehended: boolean,
  ): void {
    if (this.pieceAnswered) {
      throw new ConflictError("Today's piece is already answered");
    }

    this._contentPieceId = contentPieceId;
    this._answer = answer;
    this._comprehended = comprehended;
    this.update();
  }

  changeMood(mood: number): void {
    this._mood = mood;
    this.update();
    this.validate(["update"]);

    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  validate(fields?: string[]): void {
    const validator = DailyEntryValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ["create"]);
  }

  static create(props: DailyEntryProps): DailyEntry {
    const entry = new DailyEntry(props);
    entry.validate();

    if (entry.notification.hasErrors()) {
      throw new EntityValidationError(entry.notification.toJSON());
    }

    return entry;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      companyId: this._companyId,
      entryDate: this._entryDate,
      mood: this._mood,
      contentPieceId: this._contentPieceId,
      answer: this._answer,
      comprehended: this._comprehended,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
