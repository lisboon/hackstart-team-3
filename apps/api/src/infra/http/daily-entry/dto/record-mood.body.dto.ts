import { IsInt, Max, Min } from "class-validator";
import { HIGHEST_MOOD, LOWEST_MOOD } from "@/modules/daily-entry/domain/mood";

export class RecordMoodBodyDto {
  /**
   * Único campo aceito do cliente. Identidade e dia vêm do servidor.
   * Cinco níveis, 1 = pior. Escala interna: não aparece na tela.
   */
  @IsInt({ message: "Invalid mood" })
  @Min(LOWEST_MOOD, { message: "Invalid mood" })
  @Max(HIGHEST_MOOD, { message: "Invalid mood" })
  mood: number;
}
