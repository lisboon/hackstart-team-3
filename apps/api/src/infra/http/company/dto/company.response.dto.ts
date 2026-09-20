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

export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  /** Fuso IANA da unidade. Cuiabá e Belém não coincidem. */
  journeyZone: string;
  /** Vazia quando a unidade nunca configurou a sua: aí vale o padrão. */
  journeyShifts: JourneyShiftResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
