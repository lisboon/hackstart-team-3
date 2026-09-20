/**
 * Uma faixa de expediente da unidade, no relógio de quem lê. `closesAt` pode
 * vir `"24:00"`: é o turno que fecha na meia-noite.
 */
export class JourneyShiftResponseDto {
  /** 0 = domingo … 6 = sábado. */
  weekday: number;
  opensAt: string;
  closesAt: string;
}

/** Um dia em que a unidade não trabalha, e por quê. */
export class JourneyExceptionResponseDto {
  /** Data local, `YYYY-MM-DD`. */
  date: string;
  reason: string;
}

export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  /** Fuso IANA da unidade. Cuiabá e Belém não coincidem. */
  journeyZone: string;
  /** Vazia quando a unidade nunca configurou a sua: aí vale o padrão. */
  journeyShifts: JourneyShiftResponseDto[];
  /** Feriado, ponto facultativo, recesso e parada de fábrica da unidade. */
  journeyExceptions: JourneyExceptionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
