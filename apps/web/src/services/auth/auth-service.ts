import { z } from "zod";
import { requestJson } from "@/lib/http/client";
import type { LoginValues } from "@/schemas/auth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER" | "ADMIN";
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["USER", "MANAGER", "ADMIN"]),
  }),
});

export async function login(
  values: LoginValues,
  signal: AbortSignal,
): Promise<AuthSession> {
  const result = await requestJson("/auth/login", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(values),
  });
  const session = sessionSchema.safeParse(result);
  if (!session.success)
    throw new Error("O serviço retornou uma sessão inválida.");
  return session.data;
}
