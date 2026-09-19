import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CompanyService } from "./company.service";
import CompanyFacade from "@/modules/company/facade/company.facade";
import CompanyFacadeFactory from "@/modules/company/factory/facade.factory";
import { OrganizationsController } from "./organizations.controller";

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController],
  providers: [
    CompanyService,
    {
      provide: CompanyFacade,
      useFactory: () => CompanyFacadeFactory.create(),
    },
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
