export class DailyMoodResponseDto {
  entryDate: Date;
  mood: number;
}

export class TodayEntryResponseDto {
  entryDate: Date;
  /** Quando true, a tela mostra o app; quando false, mostra a pergunta. */
  answered: boolean;
  mood: number | null;
}
