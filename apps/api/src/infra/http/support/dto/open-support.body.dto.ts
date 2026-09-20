import { IsEnum } from "class-validator";
import { SupportResource } from "@/modules/@shared/domain/enums";

export class OpenSupportBodyDto {
  /**
   * Único campo aceito do cliente. A unidade sai da sessão e o ator não é
   * gravado: mandar qualquer identificação aqui é 422, porque o corpo não tem
   * onde guardá-la.
   */
  @IsEnum(SupportResource, { message: "Invalid resource" })
  resource: SupportResource;
}
