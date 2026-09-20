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
import { TrackResponseDto } from "./dto/track.response.dto";
import { JourneyResponseDto } from "./dto/journey.response.dto";
import { StreakResponseDto } from "./dto/streak.response.dto";
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

  @Get("track")
  @ApiOperation({
    summary: "Progress through the five COOPS stages, for the track screen",
    description:
      "Every stage always comes back, in method order, including the ones with no answer yet.",
  })
  @ApiOkResponse({ type: TrackResponseDto })
  getTrack(@CurrentSession() session: AuthenticatedSession) {
    return this.dailyEntries.getTrack({
      userId: session.userId,
      companyId: session.companyId,
    });
  }

  @Get("journey")
  @ApiOperation({
    summary: "The whole COOPS trail as nodes, for the journey map screen",
    description:
      "Every piece comes back in method order with a derived state: answered (read-only, with its outcome), current (the only answerable one), or locked. Answered pieces are never reopened for a new answer.",
  })
  @ApiOkResponse({ type: JourneyResponseDto })
  getJourney(@CurrentSession() session: AuthenticatedSession) {
    return this.dailyEntries.getJourney({
      userId: session.userId,
      companyId: session.companyId,
    });
  }

  @Get("streak")
  @ApiOperation({
    summary:
      "The person's harvest streak, personal record and week, for the home card",
    description:
      "Current streak, personal longest streak, the seven days of the current week, and the weekly protection (freeze) that keeps a missed day from resetting the streak. Never compared with other people, never sent to the manager.",
  })
  @ApiOkResponse({ type: StreakResponseDto })
  getStreak(@CurrentSession() session: AuthenticatedSession) {
    return this.dailyEntries.getStreak({
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
