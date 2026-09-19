import { Injectable } from "@nestjs/common";
import prisma from "@/infra/database/prisma.instance";

export interface AuditInput {
  companyId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  requestId: string;
}

@Injectable()
export class AuditService {
  async record(input: AuditInput): Promise<void> {
    await prisma.auditEvent.create({ data: input });
  }
}
