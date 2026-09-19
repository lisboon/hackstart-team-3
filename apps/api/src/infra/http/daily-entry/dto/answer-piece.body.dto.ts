import { IsString, IsUUID, Length } from "class-validator";

export class AnswerPieceBodyDto {
  @IsUUID("4", { message: "Invalid contentPieceId" })
  contentPieceId: string;

  /** O rótulo da opção escolhida. O servidor decide o que ela significa. */
  @IsString({ message: "Invalid answer" })
  @Length(1, 200, { message: "Invalid answer" })
  answer: string;
}
