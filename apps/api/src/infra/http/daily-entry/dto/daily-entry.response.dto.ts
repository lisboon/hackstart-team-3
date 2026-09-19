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

export class TodayEntryResponseDto {
  entryDate: Date;
  /** Quando false, a tela mostra so a pergunta de humor. */
  answered: boolean;
  mood: number | null;
  pieceAnswered: boolean;
  piece: TodayPieceDto | null;
}

export class AnswerPieceResponseDto {
  outcome: string;
  comprehended: boolean;
  sourceUrl: string;
}
