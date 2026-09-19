import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
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
import { CompanyService } from "./company.service";
import { CompanyResponseDto } from "./dto/company.response.dto";
import { UpdateCompanyBodyDto } from "./dto/update-company.body.dto";
import { UnitIndicatorsResponseDto } from "./dto/unit-indicators.response.dto";
import {
  HttpErrorResponseDto,
  ValidationErrorResponseDto,
} from "../shared/errors/error.response.dto";
import { RolesGuard } from "../auth/roles-guard";
import { Roles } from "../shared/roles.decorator";
import { UserRole } from "@/modules/@shared/domain/enums";

@ApiTags("Organizations")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiForbiddenResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard, RolesGuard)
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly companies: CompanyService) {}

  @Get("current")
  @ApiOperation({
    summary: "Get the organization derived from the current session",
  })
  @ApiOkResponse({ type: CompanyResponseDto })
  current(@CurrentSession() session: AuthenticatedSession) {
    return this.companies.findById({ id: session.companyId });
  }

  @Get("current/indicators")
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({
    summary: "Aggregated wellbeing indicators for the current organization",
    description:
      "Aggregate only. Below the minimum group size every indicator comes back null with suppressed: true.",
  })
  @ApiOkResponse({ type: UnitIndicatorsResponseDto })
  currentIndicators(@CurrentSession() session: AuthenticatedSession) {
    return this.companies.indicators({
      companyId: session.companyId,
      today: new Date(),
    });
  }

  @Patch("current")
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({
    summary: "Update the organization derived from the current session",
  })
  @ApiOkResponse({ type: CompanyResponseDto })
  updateCurrent(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: UpdateCompanyBodyDto,
  ) {
    return this.companies.update({
      id: session.companyId,
      ...body,
    });
  }
}
