import {
  addDays,
  daysBetween,
  normalizeToDayStart,
  startOfWeekMonday,
} from "@/modules/@shared/domain/utils/day";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetStreakUseCaseInputDto,
  GetStreakUseCaseInterface,
  GetStreakUseCaseOutputDto,
  WeekDayState,
  WeekDayView,
} from "./get-streak.usecase.dto";

/**
 * A proteção da ofensiva: um congelamento por semana, aplicado automaticamente.
 * Existe para não punir — um dia perdido por imprevisto não zera a sequência de
 * quem mais precisa (aversão à perda, docs/ia-e-limitacoes.md). Não é moeda nem
 * loja: é uma folga concedida pela regra.
 */
const FREEZES_PER_WEEK = 1;

export default class GetStreakUseCase implements GetStreakUseCaseInterface {
  constructor(private readonly dailyEntryGateway: DailyEntryGateway) {}

  async execute(
    data: GetStreakUseCaseInputDto,
  ): Promise<GetStreakUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const today = normalizeToDayStart(data.today);
    const dates = await this.dailyEntryGateway.findEntryDates(owner);

    const days = new Set(
      dates.map((date) => normalizeToDayStart(date).getTime()),
    );
    const has = (date: Date) => days.has(date.getTime());

    const longestStreak = this.longestRun(days);
    const { currentStreak, freezeApplied, protectedDay } = this.currentRun(
      days,
      today,
    );

    return {
      currentStreak,
      longestStreak,
      week: this.week(today, has, protectedDay),
      // A proteção é semanal: se já foi gasta para cobrir um buraco desta
      // semana, não há outra até a semana virar.
      freezesAvailable: freezeApplied ? 0 : FREEZES_PER_WEEK,
      freezeApplied,
    };
  }

  /** O maior número de dias consecutivos já registrados — recorde pessoal. */
  private longestRun(days: Set<number>): number {
    if (days.size === 0) return 0;
    const sorted = [...days].sort((a, b) => a - b);
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = Math.round((sorted[i] - sorted[i - 1]) / 86_400_000);
      run = gap === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return longest;
  }

  /**
   * A ofensiva atual, contada de trás para frente a partir de hoje (ou de
   * ontem, se hoje ainda não foi registrado — o dia não acabou). Um único
   * buraco é atravessado pela proteção semanal, sem zerar a sequência; o dia
   * coberto é devolvido para a semana marcá-lo como `protected`.
   */
  private currentRun(
    days: Set<number>,
    today: Date,
  ): {
    currentStreak: number;
    freezeApplied: boolean;
    protectedDay: number | null;
  } {
    const has = (date: Date) => days.has(date.getTime());

    // O ponto de partida: hoje se já registrado; senão ontem, porque o dia
    // corrente ainda está em aberto e não deve quebrar a ofensiva.
    let cursor = has(today) ? today : addDays(today, -1);
    if (!has(cursor)) {
      return { currentStreak: 0, freezeApplied: false, protectedDay: null };
    }

    let count = 0;
    let freezeApplied = false;
    let protectedDay: number | null = null;
    const weekStart = startOfWeekMonday(today).getTime();

    while (true) {
      if (has(cursor)) {
        count += 1;
        cursor = addDays(cursor, -1);
        continue;
      }
      // Buraco. A proteção cobre um único dia, e só uma vez por semana: só
      // vale se o dia protegido cai na semana corrente (a folga é desta
      // semana). O dia anterior a ele precisa existir para a ponte fazer
      // sentido.
      const inThisWeek = cursor.getTime() >= weekStart;
      if (!freezeApplied && inThisWeek && has(addDays(cursor, -1))) {
        freezeApplied = true;
        protectedDay = cursor.getTime();
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }

    return { currentStreak: count, freezeApplied, protectedDay };
  }

  /** Os sete dias da semana corrente (segunda a domingo) com seu estado. */
  private week(
    today: Date,
    has: (date: Date) => boolean,
    protectedDay: number | null,
  ): WeekDayView[] {
    const monday = startOfWeekMonday(today);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const diff = daysBetween(today, date);
      let state: WeekDayState;
      if (has(date)) state = "done";
      else if (date.getTime() === protectedDay) state = "protected";
      else if (diff === 0) state = "today";
      else if (diff > 0) state = "future";
      else state = "missed";
      return { date, weekday: i, state };
    });
  }
}
