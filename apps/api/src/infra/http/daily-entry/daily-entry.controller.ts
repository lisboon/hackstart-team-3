import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
import { DailyEntryService } from "./daily-entry.service";
import {
  AnswerPieceResponseDto,
  DailyMoodResponseDto,
  TodayEntryResponseDto,
} from "./dto/daily-entry.response.dto";
import { AnswerPieceBodyDto } from "./dto/answer-piece.body.dto";
import { RecordMoodBodyDto } from "./dto/record-mood.body.dto";

@ApiTags("Daily entry")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiForbiddenResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard)
@Controller("me")
export class DailyEntryController {
  constructor(private readonly dailyEntries: DailyEntryService) {}

  @Get("today")
  @ApiOperation({
    summary:
      "Whether today is already answered, so the screen knows what to show",
  })
  @ApiOkResponse({ type: TodayEntryResponseDto })
  getToday(@CurrentSession() session: AuthenticatedSession) {
    return this.dailyEntries.getToday({
      userId: session.userId,
      companyId: session.companyId,
      today: new Date(),
    });
  }

  @Post("today/mood")
  @ApiOperation({ summary: "Record how the person is feeling today" })
  @ApiCreatedResponse({ type: DailyMoodResponseDto })
  @ApiConflictResponse({
    type: HttpErrorResponseDto,
    description: "Today is already answered; the next chance is tomorrow",
  })
  recordMood(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: RecordMoodBodyDto,
  ) {
    return this.dailyEntries.recordMood({
      userId: session.userId,
      companyId: session.companyId,
      entryDate: new Date(),
      mood: body.mood,
    });
  }

  @Post("today/answer")
  @ApiOperation({
    summary: "Answer today's piece and see what the choice does",
  })
  @ApiCreatedResponse({ type: AnswerPieceResponseDto })
  @ApiNotFoundResponse({ type: HttpErrorResponseDto })
  @ApiConflictResponse({
    type: HttpErrorResponseDto,
    description: "The mood is missing, or the piece is already answered",
  })
  answerPiece(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: AnswerPieceBodyDto,
  ) {
    return this.dailyEntries.answerPiece({
      userId: session.userId,
      companyId: session.companyId,
      today: new Date(),
      contentPieceId: body.contentPieceId,
      answer: body.answer,
    });
  }
}
