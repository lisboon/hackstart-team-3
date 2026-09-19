import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedSession } from "./auth-guard";

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedSession =>
    context.switchToHttp().getRequest<{ user: AuthenticatedSession }>().user,
);
