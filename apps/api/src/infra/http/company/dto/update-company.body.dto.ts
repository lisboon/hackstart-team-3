import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

/** `"07:30"`, ou `"24:00"` no fechamento de um turno que vira o dia. */
const CLOCK = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

export class JourneyShiftBodyDto {
  @IsInt({ message: "Weekday must be an integer from 0 (Sunday) to 6" })
  @Min(0, { message: "Weekday must be an integer from 0 (Sunday) to 6" })
  @Max(6, { message: "Weekday must be an integer from 0 (Sunday) to 6" })
  weekday: number;

  @IsString({ message: "opensAt must be a time of day in HH:MM" })
  @Matches(CLOCK, { message: "opensAt must be a time of day in HH:MM" })
  opensAt: string;

  @IsString({ message: "closesAt must be a time of day in HH:MM or 24:00" })
  @Matches(CLOCK, {
    message: "closesAt must be a time of day in HH:MM or 24:00",
  })
  closesAt: string;
}

/** Um dia em que a unidade não trabalha, e por quê. */
export class JourneyExceptionBodyDto {
  @IsString({ message: "date must be a calendar day in YYYY-MM-DD" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must be a calendar day in YYYY-MM-DD",
  })
  date: string;

  @IsString({ message: "reason must be text" })
  @Length(1, 120, { message: "reason must be between 1 and 120 characters" })
  reason: string;
}

export class UpdateCompanyBodyDto {
  @IsOptional()
  @Length(2, 120, { message: "Name must be between 2 and 120 characters" })
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must be kebab-case (lowercase letters, numbers and hyphens)",
  })
  slug?: string;

  /**
   * Fuso IANA da unidade. Validado de verdade no domínio, contra a `Intl` —
   * não existe lista de fusos para comparar aqui.
   */
  @IsOptional()
  @IsString({ message: "journeyZone must be an IANA time zone name" })
  @Length(1, 64, { message: "journeyZone must be an IANA time zone name" })
  journeyZone?: string;

  /**
   * Substitui a janela inteira da unidade. Turno que atravessa a meia-noite
   * são duas faixas em dias diferentes — 22:00→24:00 e 00:00→06:00.
   */
  @IsOptional()
  @IsArray({ message: "journeyShifts must be a list of shifts" })
  @ArrayMaxSize(21, { message: "journeyShifts must have at most 21 shifts" })
  @ValidateNested({ each: true })
  @Type(() => JourneyShiftBodyDto)
  journeyShifts?: JourneyShiftBodyDto[];

  /**
   * Substitui os dias sem expediente da unidade: feriado, ponto facultativo,
   * recesso, parada de fábrica. Lista da empresa, não biblioteca de feriados —
   * MT e PA não têm o mesmo calendário.
   */
  @IsOptional()
  @IsArray({ message: "journeyExceptions must be a list of days" })
  @ArrayMaxSize(366, {
    message: "journeyExceptions must have at most 366 days",
  })
  @ValidateNested({ each: true })
  @Type(() => JourneyExceptionBodyDto)
  journeyExceptions?: JourneyExceptionBodyDto[];
}
