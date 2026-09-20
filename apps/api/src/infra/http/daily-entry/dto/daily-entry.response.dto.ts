import { ApiProperty } from "@nestjs/swagger";
import { CoopsStage } from "@/modules/@shared/domain/enums";

export class DailyMoodResponseDto {
  entryDate: Date;
  mood: number;
}

export class TodayPieceOptionDto {
  label: string;
}

export class TodayPieceDto {
  id: string;
  stage: CoopsStage;
  title: string;
  body: string;
  prompt: string;
  options: TodayPieceOptionDto[];
  sourceUrl: string;
}

export class JourneyWindowResponseDto {
  /** Quando false, humor e colheita sao recusados ate `opensAt`. */
  open: boolean;
  /** A abertura vigente, se aberta; a proxima, se fechada. */
  opensAt: Date;
  closesAt: Date;
}

export class TodayEntryResponseDto {
  entryDate: Date;
  /** Quando false, a tela mostra so a pergunta de humor. */
  answered: boolean;
  mood: number | null;
  pieceAnswered: boolean;
  piece: TodayPieceDto | null;
  /**
   * O horario de escrita da unidade. A tela le daqui para mostrar "abre
   * segunda, as 07:30" em vez de oferecer uma pergunta que sera recusada.
   */
  @ApiProperty({ type: () => JourneyWindowResponseDto })
  window: JourneyWindowResponseDto;
}

export class AnswerPieceResponseDto {
  outcome: string;
  comprehended: boolean;
  sourceUrl: string;
}
