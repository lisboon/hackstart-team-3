import { Injectable } from "@nestjs/common";
import prisma from "@/infra/database/prisma.instance";

/**
 * `actorUserId` e `requestId` são explicitamente anuláveis, não opcionais: há
 * evento que não deve saber de quem — contar abertura de canal de apoio exige
 * o número da unidade e nada além dele. Deixar como opcional faria a omissão
 * parecer esquecimento; nulo declara a decisão.
 */
export interface AuditInput {
  companyId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  requestId: string | null;
}

@Injectable()
export class AuditService {
  async record(input: AuditInput): Promise<void> {
    await prisma.auditEvent.create({ data: input });
  }
}
