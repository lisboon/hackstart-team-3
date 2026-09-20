import { Module } from "@nestjs/common";
import SavingsGoalFacade from "@/modules/savings-goal/facade/savings-goal.facade";
import SavingsGoalFacadeFactory from "@/modules/savings-goal/factory/facade.factory";
import { AuditService } from "../ai/audit.service";
import { AuthModule } from "../auth/auth.module";
import { SavingsGoalController } from "./savings-goal.controller";
import { SavingsGoalService } from "./savings-goal.service";

/**
 * `AuthModule` entra porque o controller passa por `AuthGuard`, que depende de
 * `JwtService` e `UserFacade`; sem importá-lo o Nest não resolve o guard (lição
 * da #46). `AuditService` grava ação + recurso, sem teor.
 */
@Module({
  imports: [AuthModule],
  controllers: [SavingsGoalController],
  providers: [
    SavingsGoalService,
    AuditService,
    {
      provide: SavingsGoalFacade,
      useFactory: () => SavingsGoalFacadeFactory.create(),
    },
  ],
  exports: [SavingsGoalService],
})
export class SavingsGoalModule {}
