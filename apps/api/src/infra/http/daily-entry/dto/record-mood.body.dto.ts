import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import {
  HIGHEST_MOOD,
  LOWEST_MOOD,
  MAX_MOOD_NOTE_LENGTH,
} from "@/modules/daily-entry/domain/mood";

export class RecordMoodBodyDto {
  /**
   * Cinco níveis, 1 = pior. Escala interna: não aparece na tela. Identidade e
   * dia vêm do servidor, nunca do corpo.
   */
  @IsInt({ message: "Invalid mood" })
  @Min(LOWEST_MOOD, { message: "Invalid mood" })
  @Max(HIGHEST_MOOD, { message: "Invalid mood" })
  mood: number;

  /**
   * Texto livre e opcional (#91): "quer especificar mais o que está sentindo?".
   * Estritamente pessoal — só a própria pessoa lê, nunca vai ao painel do
   * gestor. Omitir ou enviar vazio registra o humor sem nota.
   */
  @IsOptional()
  @IsString({ message: "Invalid note" })
  @MaxLength(MAX_MOOD_NOTE_LENGTH, { message: "Note is too long" })
  note?: string;
}
