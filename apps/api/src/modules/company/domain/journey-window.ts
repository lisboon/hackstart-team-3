/**
 * A janela em que a jornada diária pode ser escrita.
 *
 * Não é restrição técnica. O art. 4º da CLT conta como serviço efetivo o tempo
 * em que a pessoa está à disposição do empregador, e o TST já aplicou isso a
 * aplicativo corporativo usado fora do expediente — vira hora extra, ou
 * sobreaviso por analogia à Súmula 428. Pedir cinco minutos à noite num app de
 * saúde ocupacional é pedir trabalho não pago.
 *
 * Fecha a escrita, nunca a porta: entrar, consultar a trilha e alcançar o CVV
 * 188 seguem disponíveis 24 horas. Bloquear a entrada tornaria o apoio
 * inalcançável à noite e no fim de semana, que é quando ele mais importa.
 *
 * Mora em `company` porque é atributo da unidade, não do processo (#76): a
 * cooperativa é Ouro Verde **MT/PA**, e Cuiabá e Belém não têm o mesmo fuso.
 */

/** Minutos num dia. `closesAt` chega a este valor: é a meia-noite seguinte. */
export const MINUTES_IN_DAY = 1440;

/**
 * Uma faixa de expediente num dia da semana, em minutos desde a meia-noite
 * local. Minutos e não `"HH:MM"` porque o fim de um turno noturno é `1440`, que
 * não é hora de relógio válida — e `Date.UTC(y, m, d, 0, 1440)` já rola para o
 * dia seguinte sozinho, sem caso especial em cada leitura.
 *
 * Turno que atravessa a meia-noite são **duas faixas em dias diferentes**
 * (22:00→1440 na segunda, 0→06:00 na terça). Assim toda faixa vive dentro de um
 * único dia local, e a conversão de hora de parede para instante continua
 * valendo mesmo na virada do horário de verão.
 */
export interface JourneyShift {
  /** 0 = domingo … 6 = sábado, no fuso da unidade. */
  weekday: number;
  /** Minutos desde a meia-noite local, de 0 a 1439. */
  opensAt: number;
  /** Minutos desde a meia-noite local, de 1 a 1440. */
  closesAt: number;
}

export interface JourneyWindow {
  /** Nome IANA. `Intl` lança em zona desconhecida, e é assim que se valida. */
  zone: string;
  shifts: readonly JourneyShift[];
  /**
   * Dias em que a unidade não trabalha, como data local `YYYY-MM-DD`: feriado,
   * ponto facultativo, recesso, parada de fábrica. A lista é da empresa, e não
   * de uma biblioteca de feriados — feriado municipal não sai de biblioteca
   * nenhuma com confiança, e MT e PA não têm o mesmo calendário.
   */
  exceptions?: readonly string[];
}

export interface JourneyWindowState {
  open: boolean;
  /** A abertura vigente, se aberta; a próxima, se fechada. */
  opensAt: Date;
  /** O fechamento correspondente àquela abertura. */
  closesAt: Date;
}

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * `"07:30"` vira 450. `"24:00"` vira 1440 — é como se escreve o fim de um
 * turno que fecha na meia-noite, e o único valor fora do relógio que aceitamos.
 * Devolve `null` no que não for hora, para quem chama transformar em 422.
 */
export function minutesFromClock(value: string): number | null {
  if (value === "24:00") return MINUTES_IN_DAY;
  const match = CLOCK.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** O caminho de volta, para a tela do gestor ler o que gravou. */
export function clockFromMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Um dia sem expediente, com o motivo que a unidade registrou. */
export interface JourneyExceptionView {
  /** Data local, `YYYY-MM-DD`. */
  date: string;
  reason: string;
}

/** Uma faixa no relógio de quem lê, que é como ela entra e sai pela API. */
export interface JourneyShiftView {
  weekday: number;
  opensAt: string;
  closesAt: string;
}

/** A janela em horas de relógio, ordenada por dia e por abertura. */
export function describeShifts(
  shifts: readonly JourneyShift[],
): JourneyShiftView[] {
  return [...shifts]
    .sort((a, b) => a.weekday - b.weekday || a.opensAt - b.opensAt)
    .map((shift) => ({
      weekday: shift.weekday,
      opensAt: clockFromMinutes(shift.opensAt),
      closesAt: clockFromMinutes(shift.closesAt),
    }));
}

/**
 * Zona desconhecida faz `Intl` lançar, e é assim que se valida — não existe
 * lista de fusos para comparar. Reprovar na subida, ou no 422, é melhor que
 * descobrir no primeiro acesso.
 */
export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Uma faixa igual em cada dia da lista — a forma que `JOURNEY_WINDOW_*` descreve. */
export function uniformShifts(
  days: readonly number[],
  opensAt: number,
  closesAt: number,
): JourneyShift[] {
  return days.map((weekday) => ({ weekday, opensAt, closesAt }));
}

/**
 * O padrão do produto, e a regra de verdade: segunda a sexta, 07:30 às 18:00,
 * no fuso de Cuiabá. Vale para empresa que não configurou nada.
 */
export const DEFAULT_JOURNEY_WINDOW: JourneyWindow = {
  zone: "America/Cuiaba",
  shifts: uniformShifts([1, 2, 3, 4, 5], 7 * 60 + 30, 18 * 60),
};

/**
 * Até onde `nextOpening` procura. Uma volta de semana bastaria para dias fixos,
 * mas a parada de fábrica e o recesso de fim de ano (#77) passam disso.
 */
const SEARCH_HORIZON_DAYS = 60;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

/**
 * `hourCycle: "h23"` e não `hour12: false`: em algumas versões do ICU a segunda
 * forma devolve "24" para a meia-noite, e o cálculo erra por um dia uma vez a
 * cada 24 horas.
 */
function partsIn(zone: string, instant: Date): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(instant);

  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(find("year")),
    month: Number(find("month")),
    day: Number(find("day")),
    hour: Number(find("hour")),
    minute: Number(find("minute")),
    second: Number(find("second")),
    weekday: WEEKDAY_INDEX[find("weekday")],
  };
}

/** Quanto o relógio local está à frente do UTC, em milissegundos, naquele instante. */
function offsetAt(zone: string, instant: Date): number {
  const local = partsIn(zone, instant);
  const asUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  return asUtc - instant.getTime();
}

/**
 * Converte hora de parede local em instante. Duas passadas porque, em fuso com
 * horário de verão, o deslocamento do palpite pode não ser o do resultado.
 * Mato Grosso não tem, mas a função não é só de Mato Grosso.
 */
function instantOf(zone: string, date: LocalParts, minutes: number): Date {
  const wall = Date.UTC(date.year, date.month - 1, date.day, 0, minutes);
  const first = wall - offsetAt(zone, new Date(wall));
  const second = wall - offsetAt(zone, new Date(first));
  return new Date(second);
}

/** O mesmo relógio de parede, `offset` dias adiante. */
function shiftDays(from: LocalParts, offset: number): LocalParts {
  const moved = new Date(
    Date.UTC(from.year, from.month - 1, from.day) + offset * DAY_MS,
  );
  return {
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
    weekday: moved.getUTCDay(),
  };
}

/** A data local daquele dia, no formato em que as exceções são guardadas. */
function isoDate(date: { year: number; month: number; day: number }): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

/**
 * As faixas daquele dia, da primeira abertura para a última. Feriado não tem
 * faixa nenhuma: é o dia inteiro que sai, não um horário dele.
 */
function shiftsOn(window: JourneyWindow, day: LocalParts): JourneyShift[] {
  if (window.exceptions?.includes(isoDate(day))) return [];
  return window.shifts
    .filter((shift) => shift.weekday === day.weekday)
    .sort((a, b) => a.opensAt - b.opensAt);
}

/**
 * Se a unidade abre em algum momento daquele dia do calendário. É o que a
 * ofensiva precisa saber: um dia sem janela não é dia perdido, é dia que não
 * existiu — e a #77 é explícita em que ele não pode contar como falha.
 *
 * Recebe a data como início do dia em UTC, que é a mesma chave com que a
 * jornada diária é guardada (`DailyEntry.entryDate`).
 */
export function opensOnDay(window: JourneyWindow, day: Date): boolean {
  return (
    shiftsOn(window, {
      year: day.getUTCFullYear(),
      month: day.getUTCMonth() + 1,
      day: day.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
      weekday: day.getUTCDay(),
    }).length > 0
  );
}

/**
 * O estado da janela num instante. Puro de propósito: o instante entra por
 * argumento, e é isso que permite testar as bordas — 07:29:59 fechada e
 * 07:30:00 aberta — sem esperar o relógio.
 */
export function journeyWindowAt(
  instant: Date,
  window: JourneyWindow = DEFAULT_JOURNEY_WINDOW,
): JourneyWindowState {
  const today = partsIn(window.zone, instant);

  // A primeira faixa de hoje que ainda não fechou responde pelas duas
  // perguntas: se estamos dentro dela, e senão quando ela abre.
  for (const shift of shiftsOn(window, today)) {
    const closesAt = instantOf(window.zone, today, shift.closesAt);
    if (instant >= closesAt) continue;
    const opensAt = instantOf(window.zone, today, shift.opensAt);
    return { open: instant >= opensAt, opensAt, closesAt };
  }

  return { open: false, ...nextOpening(instant, window, today) };
}

function nextOpening(
  instant: Date,
  window: JourneyWindow,
  today: LocalParts,
): { opensAt: Date; closesAt: Date } {
  for (let offset = 1; offset <= SEARCH_HORIZON_DAYS; offset += 1) {
    const day = shiftDays(today, offset);
    for (const shift of shiftsOn(window, day)) {
      const opensAt = instantOf(window.zone, day, shift.opensAt);
      if (opensAt <= instant) continue;
      return { opensAt, closesAt: instantOf(window.zone, day, shift.closesAt) };
    }
  }

  // Configuração sem nenhuma faixa alcançável. A janela nunca abre, e dizer
  // isso com uma data impossível é melhor que devolver algo que parece uma
  // promessa.
  const never = new Date(instant.getTime() + SEARCH_HORIZON_DAYS * DAY_MS);
  return { opensAt: never, closesAt: new Date(never.getTime() + MINUTE_MS) };
}
