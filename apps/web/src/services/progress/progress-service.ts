import { requestJson } from "@/lib/http/client";
import { progressSchema, type Progress } from "@/schemas/progress";

/**
 * O mês é de quem pede: a rota sai da sessão, e o recorte do mês sai do
 * relógio do servidor. Nada de usuário nem de data por parâmetro.
 */
export async function fetchProgress(
  token: string,
  signal: AbortSignal,
): Promise<Progress> {
  const result = await requestJson("/me/progress", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const parsed = progressSchema.safeParse(result);
  if (!parsed.success)
    throw new Error("O serviço retornou um progresso inválido.");
  return parsed.data;
}
