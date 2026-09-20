import { Module } from "@nestjs/common";
import { AuditService } from "../ai/audit.service";
import { SupportController } from "./support.controller";

/**
 * Sem domínio próprio: a abertura de apoio não tem entidade nem tabela nova —
 * ela é um evento de auditoria contado por unidade. O `AuditService` é o mesmo
 * que a rota de IA usa, e não guarda estado.
 */
@Module({
  controllers: [SupportController],
  providers: [AuditService],
})
export class SupportModule {}
