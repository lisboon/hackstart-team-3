import {
  addDays,
  daysBetween,
  normalizeToDayStart,
  startOfWeekMonday,
} from "@/modules/@shared/domain/utils/day";
import { CompanyGateway } from "@/modules/company/gateway/company.gateway";
import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  opensOnDay,
} from "@/modules/company/domain/journey-window";
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

/** Um dia é presença, ausência, ou nem chegou a existir. */
type DayReader = {
  has: (date: Date) => boolean;
  opens: (date: Date) => boolean;
};

export default class GetStreakUseCase implements GetStreakUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly companyGateway: CompanyGateway,
    /**
     * A janela vem da unidade (#76). O padrão do processo é só o que vale para
     * empresa que nunca configurou a sua.
     */
    private readonly fallbackWindow: JourneyWindow = DEFAULT_JOURNEY_WINDOW,
  ) {}

  async execute(
    data: GetStreakUseCaseInputDto,
  ): Promise<GetStreakUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const today = normalizeToDayStart(data.today);
    const [dates, window] = await Promise.all([
      this.dailyEntryGateway.findEntryDates(owner),
      this.companyGateway.findJourneyWindow(data.companyId),
    ]);

    const days = new Set(
      dates.map((date) => normalizeToDayStart(date).getTime()),
    );
    const journey = window ?? this.fallbackWindow;
    const reader: DayReader = {
      has: (date) => days.has(date.getTime()),
      opens: (date) => opensOnDay(journey, date),
    };

    const longestStreak = this.longestRun(days, reader);
    const { currentStreak, freezeApplied, protectedDay } = this.currentRun(
      days,
      today,
      reader,
    );

    return {
      currentStreak,
      longestStreak,
      week: this.week(today, reader, protectedDay),
      // A proteção é semanal: se já foi gasta para cobrir um buraco desta
      // semana, não há outra até a semana virar.
      freezesAvailable: freezeApplied ? 0 : FREEZES_PER_WEEK,
      freezeApplied,
    };
  }

  /**
   * O maior número de dias seguidos já registrados — recorde pessoal. Dias em
   * que a unidade não abriu não interrompem a sequência: sábado entre duas
   * sextas nunca foi um dia perdido.
   */
  private longestRun(days: Set<number>, reader: DayReader): number {
    if (days.size === 0) return 0;
    const sorted = [...days].sort((a, b) => a - b);
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      const continues = this.onlyClosedBetween(
        new Date(sorted[i - 1]),
        new Date(sorted[i]),
        reader,
      );
      run = continues ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return longest;
  }

  /** Se tudo que existe entre dois registros são dias sem expediente. */
  private onlyClosedBetween(from: Date, to: Date, reader: DayReader): boolean {
    for (
      let day = addDays(from, 1);
      day.getTime() < to.getTime();
      day = addDays(day, 1)
    ) {
      if (reader.opens(day)) return false;
    }
    return true;
  }

  /**
   * A ofensiva atual, contada de trás para frente a partir de hoje (ou de
   * ontem, se hoje ainda não foi registrado — o dia não acabou). Dia em que a
   * unidade não abriu é atravessado sem custo. Um único buraco em dia útil é
   * atravessado pela proteção semanal, sem zerar a sequência; o dia coberto é
   * devolvido para a semana marcá-lo como `protected`.
   */
  private currentRun(
    days: Set<number>,
    today: Date,
    reader: DayReader,
  ): {
    currentStreak: number;
    freezeApplied: boolean;
    protectedDay: number | null;
  } {
    const nothing = {
      currentStreak: 0,
      freezeApplied: false,
      protectedDay: null,
    };
    if (days.size === 0) return nothing;

    // Nenhuma sequência começa antes do primeiro registro, e é esse o piso que
    // impede a caminhada de correr o calendário inteiro.
    const oldest = Math.min(...days);

    // O ponto de partida: hoje se já registrado; senão ontem, porque o dia
    // corrente ainda está em aberto e não deve quebrar a ofensiva. Dias
    // fechados antes dele são pulados — um sábado não interrompe nada.
    let cursor = reader.has(today) ? today : addDays(today, -1);
    while (
      !reader.has(cursor) &&
      !reader.opens(cursor) &&
      cursor.getTime() >= oldest
    ) {
      cursor = addDays(cursor, -1);
    }
    if (!reader.has(cursor)) return nothing;

    let count = 0;
    let freezeApplied = false;
    let protectedDay: number | null = null;
    const weekStart = startOfWeekMonday(today).getTime();

    while (cursor.getTime() >= oldest) {
      if (reader.has(cursor)) {
        count += 1;
        cursor = addDays(cursor, -1);
        continue;
      }
      // Dia em que a unidade não abriu: não é presença nem falta, e não gasta
      // a proteção. Punir quem não trabalhou no feriado seria o oposto do
      // produto (#77).
      if (!reader.opens(cursor)) {
        cursor = addDays(cursor, -1);
        continue;
      }
      // Buraco em dia útil. A proteção cobre um único dia, e só uma vez por
      // semana: só vale se o dia protegido cai na semana corrente (a folga é
      // desta semana). O dia anterior a ele precisa existir para a ponte fazer
      // sentido.
      const inThisWeek = cursor.getTime() >= weekStart;
      if (!freezeApplied && inThisWeek && reader.has(addDays(cursor, -1))) {
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
    reader: DayReader,
    protectedDay: number | null,
  ): WeekDayView[] {
    const monday = startOfWeekMonday(today);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const diff = daysBetween(today, date);
      let state: WeekDayState;
      if (reader.has(date)) state = "done";
      else if (date.getTime() === protectedDay) state = "protected";
      // Antes de `today` e de `future`: num feriado não há diária a fazer, e
      // dizer "hoje" convidaria a uma cobrança que a regra não faz.
      else if (!reader.opens(date)) state = "closed";
      else if (diff === 0) state = "today";
      else if (diff > 0) state = "future";
      else state = "missed";
      return { date, weekday: i, state };
    });
  }
}
