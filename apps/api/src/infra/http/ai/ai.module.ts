import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { AiController } from "./ai.controller";
import { AiGateway } from "./ai.gateway";
import { AuditService } from "./audit.service";

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AiController],
  providers: [AiGateway, AuditService],
})
export class AiModule {}
