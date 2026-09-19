import { z } from "zod";
import { requestJson } from "@/lib/http/client";
import type { LoginValues } from "@/schemas/auth";

const sessionSchema = z.object({ accessToken: z.string().min(1) });

export async function login(
  values: LoginValues,
  signal: AbortSignal,
): Promise<string> {
  const result = await requestJson("/auth/login", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(values),
  });
  const session = sessionSchema.safeParse(result);
  if (!session.success)
    throw new Error("O serviço retornou uma sessão inválida.");
  return session.data.accessToken;
}
