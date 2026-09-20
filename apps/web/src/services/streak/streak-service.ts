import { requestJson } from "@/lib/http/client";
import { streakSchema, type Streak } from "@/schemas/streak";

/**
 * A ofensiva é de quem pede: a rota sai da sessão, sem usuário por parâmetro,
 * como todo recurso pessoal. Nada aqui é comparado com outras pessoas.
 */
export async function fetchStreak(
  token: string,
  signal: AbortSignal,
): Promise<Streak> {
  const result = await requestJson("/me/streak", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const parsed = streakSchema.safeParse(result);
  if (!parsed.success)
    throw new Error("O serviço retornou uma ofensiva inválida.");
  return parsed.data;
}
