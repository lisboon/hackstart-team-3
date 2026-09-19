import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
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
import { RolesGuard } from "../auth/roles-guard";
import { Roles } from "../shared/roles.decorator";
import { UserRole } from "@/modules/@shared/domain/enums";
import { UserService } from "./user.service";
import { UpdateUserBodyDto } from "./dto/update-user.body.dto";
import { ChangePasswordBodyDto } from "./dto/change-password.body.dto";
import { CreateUserBodyDto } from "./dto/create-user.body.dto";
import { FindUsersQueryDto } from "./dto/find-users.query.dto";
import { UuidParamDto } from "../shared/dto/uuid-param.dto";
import {
  ChangePasswordResponseDto,
  DeleteUserResponseDto,
  UserResponseDto,
  UsersPageResponseDto,
} from "./dto/user.response.dto";
import {
  HttpErrorResponseDto,
  ValidationErrorResponseDto,
} from "../shared/errors/error.response.dto";

@ApiTags("Users")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiForbiddenResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({ summary: "Create user (admin only)" })
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateUserBodyDto,
  ) {
    return this.userService.create({
      ...body,
      companyId: session.companyId,
    });
  }

  @Get()
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({ summary: "List users with pagination and filters" })
  @ApiOkResponse({ type: UsersPageResponseDto })
  async findAll(
    @CurrentSession() session: AuthenticatedSession,
    @Query() query: FindUsersQueryDto,
  ) {
    return this.userService.findAll({
      ...query,
      companyId: session.companyId,
    });
  }

  @Patch("me/password")
  @Roles({ role: UserRole.USER })
  @ApiOperation({ summary: "Change own password" })
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  async changePassword(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: ChangePasswordBodyDto,
  ) {
    return this.userService.changePassword({
      id: session.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }

  @Get(":id")
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({ summary: "Find user by id (admin only)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  async findById(
    @CurrentSession() session: AuthenticatedSession,
    @Param() params: UuidParamDto,
  ) {
    return this.userService.findById({
      id: params.id,
      companyId: session.companyId,
    });
  }

  @Patch(":id")
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({ summary: "Update user (admin only)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  async update(
    @CurrentSession() session: AuthenticatedSession,
    @Param() params: UuidParamDto,
    @Body() body: UpdateUserBodyDto,
  ) {
    return this.userService.update({
      id: params.id,
      companyId: session.companyId,
      ...body,
    });
  }

  @Delete(":id")
  @Roles({ role: UserRole.ADMIN })
  @ApiOperation({ summary: "Soft delete user (admin only)" })
  @ApiOkResponse({ type: DeleteUserResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  async delete(
    @CurrentSession() session: AuthenticatedSession,
    @Param() params: UuidParamDto,
  ) {
    return this.userService.delete({
      id: params.id,
      companyId: session.companyId,
    });
  }
}
