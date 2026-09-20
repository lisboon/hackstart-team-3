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
 */

export interface JourneyWindow {
  /** Nome IANA. `Intl` lança em zona desconhecida, e é assim que se valida. */
  zone: string;
  /** Dias da semana, 0 = domingo … 6 = sábado. */
  days: readonly number[];
  opensAt: DayTime;
  closesAt: DayTime;
}

export interface DayTime {
  hour: number;
  minute: number;
}

export interface JourneyWindowState {
  open: boolean;
  /** A abertura vigente, se aberta; a próxima, se fechada. */
  opensAt: Date;
  /** O fechamento correspondente àquela abertura. */
  closesAt: Date;
}

/**
 * Cuiabá é UTC−4 o ano inteiro: Mato Grosso não tem horário de verão desde
 * 2019. A cooperativa é Ouro Verde **MT/PA**, e Belém é UTC−3 — então esta
 * janela já está uma hora deslocada para metade da área de atuação. É limite
 * declarado, não descuido: a janela por unidade é o passo seguinte, e a forma
 * desta configuração existe para que seja uma leitura de `Company`, não uma
 * reescrita.
 */
export const DEFAULT_JOURNEY_WINDOW: JourneyWindow = {
  zone: "America/Cuiaba",
  days: [1, 2, 3, 4, 5],
  opensAt: { hour: 7, minute: 30 },
  closesAt: { hour: 18, minute: 0 },
};

const DAYS_IN_WEEK = 7;
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
function instantOf(zone: string, date: LocalParts, time: DayTime): Date {
  const wall = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
  );
  const first = wall - offsetAt(zone, new Date(wall));
  const second = wall - offsetAt(zone, new Date(first));
  return new Date(second);
}

/** O mesmo relógio de parede, `offset` dias adiante. */
function shiftDays(zone: string, from: LocalParts, offset: number): LocalParts {
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

  if (window.days.includes(today.weekday)) {
    const opensAt = instantOf(window.zone, today, window.opensAt);
    const closesAt = instantOf(window.zone, today, window.closesAt);
    if (instant >= opensAt && instant < closesAt) {
      return { open: true, opensAt, closesAt };
    }
    if (instant < opensAt) {
      return { open: false, opensAt, closesAt };
    }
  }

  return { open: false, ...nextOpening(instant, window, today) };
}

function nextOpening(
  instant: Date,
  window: JourneyWindow,
  today: LocalParts,
): { opensAt: Date; closesAt: Date } {
  // Uma volta inteira basta: com pelo menos um dia configurado, a próxima
  // abertura está dentro de sete dias.
  for (let offset = 1; offset <= DAYS_IN_WEEK; offset += 1) {
    const day = shiftDays(window.zone, today, offset);
    if (!window.days.includes(day.weekday)) continue;
    const opensAt = instantOf(window.zone, day, window.opensAt);
    if (opensAt <= instant) continue;
    return { opensAt, closesAt: instantOf(window.zone, day, window.closesAt) };
  }

  // Configuração sem nenhum dia. A janela nunca abre, e dizer isso com uma
  // data impossível é melhor que devolver algo que parece uma promessa.
  const never = new Date(instant.getTime() + DAYS_IN_WEEK * DAY_MS);
  return { opensAt: never, closesAt: new Date(never.getTime() + MINUTE_MS) };
}
