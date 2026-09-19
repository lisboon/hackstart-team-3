import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { RecordSelfReportBodyDto } from "./dto/record-self-report.body.dto";
import {
  SelfReportResponseDto,
  SelfReportSummaryResponseDto,
} from "./dto/self-report.response.dto";
import { SelfReportService } from "./self-report.service";

@ApiTags("Self report")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiForbiddenResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard)
@Controller("me")
export class SelfReportController {
  constructor(private readonly selfReports: SelfReportService) {}

  @Post("self-report")
  @ApiOperation({ summary: "Declare how the current month went" })
  @ApiCreatedResponse({ type: SelfReportResponseDto })
  record(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: RecordSelfReportBodyDto,
  ) {
    return this.selfReports.record({
      userId: session.userId,
      companyId: session.companyId,
      referenceMonth: new Date(),
      situation: body.situation,
    });
  }

  @Get("summary")
  @ApiOperation({
    summary: "Personal trajectory, compared against the person's own past",
  })
  @ApiOkResponse({ type: SelfReportSummaryResponseDto })
  getSummary(@CurrentSession() session: AuthenticatedSession) {
    return this.selfReports.getSummary({
      userId: session.userId,
      companyId: session.companyId,
      today: new Date(),
    });
  }
}
