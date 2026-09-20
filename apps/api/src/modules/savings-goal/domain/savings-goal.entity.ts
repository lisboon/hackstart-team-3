import BaseEntity from "@/modules/@shared/domain/entity/base.entity";
import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import {
  SavingsGoalKind,
  SavingsGoalStatus,
  SavingsGoalUnmetReason,
} from "@/modules/@shared/domain/enums";
import { normalizeToMonthStart } from "@/modules/@shared/domain/utils/month";
import SavingsGoalValidatorFactory from "./validators/savings-goal.validator";

export interface SavingsGoalProps {
  id?: string;
  userId: string;
  companyId: string;
  kind: SavingsGoalKind;
  /** Só para ENDURING: por quantos meses manter a guarda. */
  targetMonths?: number;
  startMonth: Date;
  status?: SavingsGoalStatus;
  unmetReason?: SavingsGoalUnmetReason;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Meta de guarda pessoal. Mede intenção e hábito, nunca dinheiro: não há campo
 * de valor. O cumprimento mensal deriva da declaração do mês (SelfReport), no
 * caso de uso — a entidade só guarda o objetivo e o estado.
 */
export class SavingsGoal extends BaseEntity {
  private _userId: string;
  private _companyId: string;
  private _kind: SavingsGoalKind;
  private _targetMonths: number | undefined;
  private _startMonth: Date;
  private _status: SavingsGoalStatus;
  private _unmetReason: SavingsGoalUnmetReason | undefined;

  constructor(props: SavingsGoalProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._userId = props.userId;
    this._companyId = props.companyId;
    this._kind = props.kind;
    this._targetMonths = props.targetMonths;
    this._startMonth = normalizeToMonthStart(props.startMonth);
    this._status = props.status ?? SavingsGoalStatus.ACTIVE;
    this._unmetReason = props.unmetReason;
  }

  get userId(): string {
    return this._userId;
  }

  get companyId(): string {
    return this._companyId;
  }

  get kind(): SavingsGoalKind {
    return this._kind;
  }

  get targetMonths(): number | undefined {
    return this._targetMonths;
  }

  get startMonth(): Date {
    return this._startMonth;
  }

  get status(): SavingsGoalStatus {
    return this._status;
  }

  get unmetReason(): SavingsGoalUnmetReason | undefined {
    return this._unmetReason;
  }

  get isActive(): boolean {
    return this._status === SavingsGoalStatus.ACTIVE;
  }

  /**
   * Cumprida: o mês (MONTHLY) ou os N meses (ENDURING) fecharam no azul. Só faz
   * sentido para uma meta ativa — o caso de uso decide quando chamar, a partir
   * das declarações. Idempotente: marcar de novo não muda nada.
   */
  markMet(): void {
    if (this._status === SavingsGoalStatus.ACTIVE) {
      this._status = SavingsGoalStatus.MET;
      this.update();
    }
  }

  /**
   * Estende o prazo de uma meta duradoura. Falha não pune: no fim do prazo sem
   * cumprir, a pessoa pode dar mais meses em vez de encerrar. Só ENDURING tem
   * prazo a estender, e só enquanto ativa.
   */
  extend(newTargetMonths: number): void {
    if (this._kind !== SavingsGoalKind.ENDURING) {
      throw new ConflictError("Only an enduring goal has a term to extend");
    }
    if (this._status !== SavingsGoalStatus.ACTIVE) {
      throw new ConflictError("Only an active goal can be extended");
    }
    this._targetMonths = newTargetMonths;
    this.update();
    this.validate(["update"]);
    if (this.notification.hasErrors()) {
      throw new EntityValidationError(this.notification.toJSON());
    }
  }

  /**
   * Encerra a meta. O motivo é opcional e fechado (nunca texto livre); serve à
   * própria pessoa e nunca sai do recurso pessoal.
   */
  end(reason?: SavingsGoalUnmetReason): void {
    this._status = SavingsGoalStatus.ENDED;
    this._unmetReason = reason;
    this.update();
  }

  validate(fields?: string[]): void {
    const validator = SavingsGoalValidatorFactory.create();
    validator.validate(this._notification, this, fields ?? ["create"]);
  }

  static create(props: SavingsGoalProps): SavingsGoal {
    const goal = new SavingsGoal(props);
    goal.validate();

    if (goal.notification.hasErrors()) {
      throw new EntityValidationError(goal.notification.toJSON());
    }

    // Uma meta duradoura sem prazo não é duradoura; uma mensal com prazo é
    // contraditória. A regra estrutural vive aqui, além do validador de campos.
    if (props.kind === SavingsGoalKind.ENDURING && !props.targetMonths) {
      throw new EntityValidationError([
        {
          field: "targetMonths",
          message: "An enduring goal needs a number of months",
        },
      ]);
    }
    if (props.kind === SavingsGoalKind.MONTHLY && props.targetMonths) {
      throw new EntityValidationError([
        { field: "targetMonths", message: "A monthly goal has no term" },
      ]);
    }

    return goal;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      companyId: this._companyId,
      kind: this._kind,
      targetMonths: this._targetMonths,
      startMonth: this._startMonth,
      status: this._status,
      unmetReason: this._unmetReason,
      active: this._active,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
