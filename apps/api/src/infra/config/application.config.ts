import ms, { StringValue } from "ms";
import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  isValidTimeZone,
  uniformShifts,
} from "@/modules/company/domain/journey-window";

const DEFAULT_PORT = 3001;
const DEFAULT_BCRYPT_ROUNDS = 12;
const MIN_BCRYPT_ROUNDS = 10;
const MAX_BCRYPT_ROUNDS = 15;
const MIN_JWT_SECRET_LENGTH = 32;

export type NodeEnvironment = "development" | "test" | "production";

export interface JwtConfig {
  secret: string;
  expiresIn: StringValue;
}

export interface ApplicationConfig {
  nodeEnv: NodeEnvironment;
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  jwt: JwtConfig;
  bcryptRounds: number;
  throttle: {
    limit: number;
    windowMs: number;
  };
  ai: {
    serviceUrl: string;
    internalToken: string;
    timeoutMs: number;
  };
  journeyWindow: JourneyWindow;
}

export class ApplicationConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid application configuration:\n- ${issues.join("\n- ")}`);
    this.name = ApplicationConfigError.name;
  }
}

export function loadApplicationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ApplicationConfig {
  const issues: string[] = [];
  const nodeEnv = parseNodeEnvironment(environment.NODE_ENV, issues);
  const databaseUrl = parseDatabaseUrl(environment.DATABASE_URL, issues);
  const jwtSecret = parseJwtSecret(environment.JWT_SECRET, nodeEnv, issues);
  const jwtExpiresIn = parseJwtExpiration(environment.JWT_EXPIRES_IN, issues);

  const config: ApplicationConfig = {
    nodeEnv,
    port: parseInteger(
      "PORT",
      environment.PORT,
      DEFAULT_PORT,
      1,
      65_535,
      issues,
    ),
    databaseUrl,
    corsOrigins: parseCorsOrigins(environment.CORS_ORIGINS, issues),
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    },
    bcryptRounds: parseInteger(
      "BCRYPT_ROUNDS",
      environment.BCRYPT_ROUNDS,
      DEFAULT_BCRYPT_ROUNDS,
      MIN_BCRYPT_ROUNDS,
      MAX_BCRYPT_ROUNDS,
      issues,
    ),
    throttle: {
      limit: parseInteger(
        "THROTTLE_LIMIT",
        environment.THROTTLE_LIMIT,
        30,
        1,
        Number.MAX_SAFE_INTEGER,
        issues,
      ),
      windowMs: parseInteger(
        "THROTTLE_WINDOW_MS",
        environment.THROTTLE_WINDOW_MS,
        60_000,
        1,
        Number.MAX_SAFE_INTEGER,
        issues,
      ),
    },
    ai: {
      serviceUrl: parseHttpUrl(
        "AI_SERVICE_URL",
        environment.AI_SERVICE_URL ?? "http://localhost:8000",
        issues,
      ),
      internalToken: parseServiceToken(
        environment.AI_INTERNAL_TOKEN,
        nodeEnv,
        issues,
      ),
      timeoutMs: parseInteger(
        "AI_TIMEOUT_MS",
        environment.AI_TIMEOUT_MS,
        60_000,
        1_000,
        300_000,
        issues,
      ),
    },
    journeyWindow: parseJourneyWindow(environment, issues),
  };

  if (issues.length > 0) {
    throw new ApplicationConfigError(issues);
  }

  return config;
}

/**
 * A janela **padrao**: o que vale para empresa que ainda nao configurou a sua,
 * e o que a semente grava na empresa nova. A janela de verdade vem da unidade
 * desde a #76 — a cooperativa atende MT e PA, que nem sequer tem o mesmo fuso.
 *
 * Continua configuravel por ambiente porque e a chave da demonstracao: o
 * docker-compose sobe com os sete dias abertos, e a semente leva isso para as
 * faixas da empresa. O padrao do codigo e a regra de verdade — segunda a
 * sexta, 07:30 as 18:00.
 *
 * O ambiente so descreve uma faixa igual em cada dia. Turno partido e turno da
 * noite sao configuracao da unidade, nao do processo.
 */
function parseJourneyWindow(
  environment: NodeJS.ProcessEnv,
  issues: string[],
): JourneyWindow {
  const defaults = DEFAULT_JOURNEY_WINDOW.shifts[0];
  return {
    zone: parseTimeZone(environment.JOURNEY_WINDOW_ZONE, issues),
    shifts: uniformShifts(
      parseWeekDays(environment.JOURNEY_WINDOW_DAYS, issues),
      parseDayTime(
        "JOURNEY_WINDOW_OPENS",
        environment.JOURNEY_WINDOW_OPENS,
        defaults.opensAt,
        issues,
      ),
      parseDayTime(
        "JOURNEY_WINDOW_CLOSES",
        environment.JOURNEY_WINDOW_CLOSES,
        defaults.closesAt,
        issues,
      ),
    ),
  };
}

/**
 * Zona desconhecida faz `Intl` lancar. Reprovar na subida e melhor que
 * descobrir no primeiro acesso — ou no palco.
 */
function parseTimeZone(raw: string | undefined, issues: string[]): string {
  const value = raw?.trim() || DEFAULT_JOURNEY_WINDOW.zone;
  if (!isValidTimeZone(value)) {
    issues.push(`JOURNEY_WINDOW_ZONE must be a valid IANA time zone`);
    return DEFAULT_JOURNEY_WINDOW.zone;
  }
  return value;
}

/** "1,2,3,4,5" — 0 e domingo. Lista vazia fecharia a jornada para sempre. */
function parseWeekDays(
  raw: string | undefined,
  issues: string[],
): readonly number[] {
  const fallback = DEFAULT_JOURNEY_WINDOW.shifts.map((shift) => shift.weekday);
  if (raw === undefined) return fallback;

  const days = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .map(Number);

  if (
    days.length === 0 ||
    days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  ) {
    issues.push(
      "JOURNEY_WINDOW_DAYS must be a non-empty list of week days from 0 (Sunday) to 6",
    );
    return fallback;
  }

  return [...new Set(days)].sort((a, b) => a - b);
}

/** "07:30" no relogio local da unidade, em minutos desde a meia-noite. */
function parseDayTime(
  name: string,
  raw: string | undefined,
  fallback: number,
  issues: string[],
): number {
  if (raw === undefined) return fallback;

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  if (!match) {
    issues.push(`${name} must be a time of day in HH:MM, from 00:00 to 23:59`);
    return fallback;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function parseHttpUrl(name: string, raw: string, issues: string[]): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      issues.push(`${name} must use http or https`);
    }
  } catch {
    issues.push(`${name} must be a valid URL`);
  }
  return raw.replace(/\/$/, "");
}

function parseServiceToken(
  raw: string | undefined,
  nodeEnv: NodeEnvironment,
  issues: string[],
): string {
  if (!raw && nodeEnv === "production") {
    issues.push("AI_INTERNAL_TOKEN is required in production");
    return "";
  }
  const value = raw ?? "dev-only-internal-service-token";
  if (nodeEnv === "production" && value.length < 32) {
    issues.push(
      "AI_INTERNAL_TOKEN must contain at least 32 characters in production",
    );
  }
  return value;
}

function parseNodeEnvironment(
  raw: string | undefined,
  issues: string[],
): NodeEnvironment {
  const value = raw ?? "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  issues.push("NODE_ENV must be development, test, or production");
  return "development";
}

function parseDatabaseUrl(raw: string | undefined, issues: string[]): string {
  if (!raw) {
    issues.push("DATABASE_URL is required");
    return "";
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      issues.push("DATABASE_URL must use the postgresql or postgres protocol");
    }
  } catch {
    issues.push("DATABASE_URL must be a valid URL");
  }

  return raw;
}

function parseJwtSecret(
  raw: string | undefined,
  nodeEnv: NodeEnvironment,
  issues: string[],
): string {
  if (!raw) {
    issues.push("JWT_SECRET is required");
    return "";
  }

  if (nodeEnv !== "test" && raw.length < MIN_JWT_SECRET_LENGTH) {
    issues.push(
      `JWT_SECRET must contain at least ${MIN_JWT_SECRET_LENGTH} characters outside the test environment`,
    );
  }

  return raw;
}

function parseJwtExpiration(
  raw: string | undefined,
  issues: string[],
): StringValue {
  const value = (raw ?? "7d") as StringValue;
  const duration = ms(value);
  if (duration === undefined || duration <= 0) {
    issues.push(
      "JWT_EXPIRES_IN must be a positive duration, such as 15m, 1h, or 7d",
    );
  }
  return value;
}

function parseCorsOrigins(raw: string | undefined, issues: string[]): string[] {
  const origins = (raw ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    issues.push("CORS_ORIGINS must contain at least one origin");
  }

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        issues.push(`CORS_ORIGINS contains an unsupported origin: ${origin}`);
      }
    } catch {
      issues.push(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }
  }

  return origins;
}

function parseInteger(
  name: string,
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  issues: string[],
): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    issues.push(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}
