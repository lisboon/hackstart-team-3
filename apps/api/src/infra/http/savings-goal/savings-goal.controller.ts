import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthGuard, AuthenticatedSession } from "../auth/auth-guard";
import { CurrentSession } from "../auth/current-session.decorator";
import {
  HttpErrorResponseDto,
  ValidationErrorResponseDto,
} from "../shared/errors/error.response.dto";
import { UuidParamDto } from "../shared/dto/uuid-param.dto";
import { AuditService } from "../ai/audit.service";
import { CreateGoalBodyDto } from "./dto/create-goal.body.dto";
import {
  UpdateGoalAction,
  UpdateGoalBodyDto,
} from "./dto/update-goal.body.dto";
import {
  CreateGoalResponseDto,
  GoalsResponseDto,
  UpdateGoalResponseDto,
} from "./dto/savings-goal.response.dto";
import { SavingsGoalService } from "./savings-goal.service";

const GOAL_RESOURCE = "savings_goal";

@ApiTags("Savings goal")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiForbiddenResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard)
@Controller("me")
export class SavingsGoalController {
  constructor(
    private readonly goals: SavingsGoalService,
    private readonly audit: AuditService,
  ) {}

  @Post("goals")
  @ApiOperation({ summary: "Create a personal savings goal (no money value)" })
  @ApiCreatedResponse({ type: CreateGoalResponseDto })
  async create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateGoalBodyDto,
  ): Promise<CreateGoalResponseDto> {
    const created = await this.goals.create({
      userId: session.userId,
      companyId: session.companyId,
      kind: body.kind,
      targetAmountCents: body.targetAmountCents,
      targetMonths: body.targetMonths,
      today: new Date(),
    });
    // Auditoria: ação e recurso, sem teor. Nada da meta em si é guardado aqui.
    await this.audit.record({
      companyId: session.companyId,
      actorUserId: session.userId,
      action: "goal.created",
      resourceType: GOAL_RESOURCE,
      requestId: null,
    });
    return created;
  }

  @Get("goals")
  @ApiOperation({
    summary: "The person's own goals, with progress derived from declarations",
  })
  @ApiOkResponse({ type: GoalsResponseDto })
  getGoals(@CurrentSession() session: AuthenticatedSession) {
    return this.goals.getGoals({
      userId: session.userId,
      companyId: session.companyId,
      today: new Date(),
    });
  }

  @Patch("goals/:id")
  @ApiOperation({ summary: "Extend the term of a goal, or end it" })
  @ApiOkResponse({ type: UpdateGoalResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @ApiConflictResponse({
    type: HttpErrorResponseDto,
    description: "Only an active enduring goal can be extended",
  })
  async update(
    @CurrentSession() session: AuthenticatedSession,
    @Param() params: UuidParamDto,
    @Body() body: UpdateGoalBodyDto,
  ): Promise<UpdateGoalResponseDto> {
    const owner = { userId: session.userId, companyId: session.companyId };

    if (body.action === UpdateGoalAction.EXTEND) {
      const extended = await this.goals.extend({
        ...owner,
        id: params.id,
        targetMonths: body.targetMonths as number,
      });
      await this.audit.record({
        companyId: session.companyId,
        actorUserId: session.userId,
        action: "goal.extended",
        resourceType: GOAL_RESOURCE,
        requestId: null,
      });
      return {
        id: extended.id,
        status: "ACTIVE" as UpdateGoalResponseDto["status"],
        targetMonths: extended.targetMonths,
      };
    }

    const ended = await this.goals.end({
      ...owner,
      id: params.id,
      unmetReason: body.unmetReason,
    });
    await this.audit.record({
      companyId: session.companyId,
      actorUserId: session.userId,
      action: "goal.ended",
      resourceType: GOAL_RESOURCE,
      requestId: null,
    });
    return {
      id: ended.id,
      status: ended.status as UpdateGoalResponseDto["status"],
      targetMonths: null,
    };
  }
}
