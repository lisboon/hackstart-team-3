import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { AuditService } from "../ai/audit.service";
import { SUPPORT_OPENED_ACTION } from "@/modules/@shared/domain/enums";
import { OpenSupportBodyDto } from "./dto/open-support.body.dto";
import { SupportOpenedResponseDto } from "./dto/support.response.dto";

@ApiTags("Support")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard)
@Controller("me")
export class SupportController {
  constructor(private readonly audit: AuditService) {}

  /**
   * Conta a abertura de um recurso de apoio, sem guardar quem abriu.
   *
   * A sessão entra para dizer **de qual unidade** é a contagem, e sai sem
   * deixar rastro: `actorUserId` vai nulo porque saber quem abriu o CVV seria
   * inferir sofrimento de uma pessoa identificada, exatamente o que o produto
   * promete não fazer. Não é limitação, é o desenho.
   *
   * `requestId` também vai nulo, e por um motivo específico: ele nasce do
   * header `x-request-id`, controlado pelo cliente. Guardá-lo abriria caminho
   * para alguém mandar ali o próprio identificador e desfazer o anonimato pela
   * porta de trás.
   */
  @Post("support/opened")
  @ApiOperation({
    summary: "Count that a support resource was opened, without recording who",
  })
  @ApiCreatedResponse({ type: SupportOpenedResponseDto })
  async open(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: OpenSupportBodyDto,
  ): Promise<SupportOpenedResponseDto> {
    await this.audit.record({
      companyId: session.companyId,
      actorUserId: null,
      action: SUPPORT_OPENED_ACTION,
      resourceType: body.resource,
      requestId: null,
    });
    return { resource: body.resource };
  }
}
