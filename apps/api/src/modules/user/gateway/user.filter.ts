import { UserRole } from "@/modules/@shared/domain/enums";

export interface UserFilter {
  companyId?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}
