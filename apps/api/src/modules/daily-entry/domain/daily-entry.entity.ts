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
  moodDeclared?: boolean;
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
  private _moodDeclared: boolean;
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
    // Sem informação em contrário, um humor é uma declaração. O automático é
    // criado explicitamente com `false`.
    this._moodDeclared = props.moodDeclared ?? true;
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

  get moodDeclared(): boolean {
    return this._moodDeclared;
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

  /**
   * A pessoa declara o humor. Marca `moodDeclared`, então sobrescrever depois
   * um humor automático é permitido, mas sobrescrever um já declarado não —
   * a decisão de bloquear a correção fica no caso de uso, que conhece o estado
   * anterior.
   */
  changeMood(mood: number): void {
    this._mood = mood;
    this._moodDeclared = true;
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

  /**
   * A entrada aberta pela colheita quando a pessoa ainda não disse como está.
   * O humor é neutro e fica marcado como NÃO declarado: existe só para o dia
   * ter uma linha, e é sobrescrito assim que a pessoa declarar de verdade. Não
   * conta como declaração no painel do gestor.
   */
  static createAutomatic(
    props: Omit<DailyEntryProps, "mood" | "moodDeclared">,
    neutralMood: number,
  ): DailyEntry {
    return DailyEntry.create({
      ...props,
      mood: neutralMood,
      moodDeclared: false,
    });
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      companyId: this._companyId,
      entryDate: this._entryDate,
      mood: this._mood,
      moodDeclared: this._moodDeclared,
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
