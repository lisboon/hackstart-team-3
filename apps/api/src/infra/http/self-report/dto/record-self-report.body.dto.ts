import { IsEnum } from "class-validator";
import { SelfReportSituation } from "@/modules/@shared/domain/enums";

export class RecordSelfReportBodyDto {
  /**
   * Único campo aceito do cliente. Mês e identidade vêm do servidor: o mês do
   * relógio dele, o usuário e a empresa da sessão.
   */
  @IsEnum(SelfReportSituation, { message: "Invalid situation" })
  situation: SelfReportSituation;
}
