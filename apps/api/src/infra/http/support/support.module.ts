import { Module } from "@nestjs/common";
import { AuditService } from "../ai/audit.service";
import { AuthModule } from "../auth/auth.module";
import { SupportController } from "./support.controller";

/**
 * Sem domínio próprio: a abertura de apoio não tem entidade nem tabela nova —
 * ela é um evento de auditoria contado por unidade. O `AuditService` é o mesmo
 * que a rota de IA usa, e não guarda estado.
 *
 * `AuthModule` entra porque o controller passa por `AuthGuard`, que depende de
 * `JwtService` e `UserFacade`: sem importá-lo, o Nest não resolve o guard e o
 * módulo nem sobe.
 */
@Module({
  imports: [AuthModule],
  controllers: [SupportController],
  providers: [AuditService],
})
export class SupportModule {}
