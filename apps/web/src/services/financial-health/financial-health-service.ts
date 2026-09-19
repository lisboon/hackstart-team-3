import { requestJson } from "@/lib/http/client";
import {
  personalSummarySchema,
  type PersonalSummary,
  type SelfReportSituation,
} from "@/schemas/financial-health";

function authorized(token: string, signal: AbortSignal): RequestInit {
  return { signal, headers: { authorization: `Bearer ${token}` } };
}

export async function fetchPersonalSummary(
  token: string,
  signal: AbortSignal,
): Promise<PersonalSummary> {
  const result = await requestJson("/me/summary", {
    method: "GET",
    ...authorized(token, signal),
  });
  const summary = personalSummarySchema.safeParse(result);
  if (!summary.success)
    throw new Error("O serviço retornou um resumo inválido.");
  return summary.data;
}

/**
 * Declarar de novo no mesmo mês corrige a declaração. A resposta só repete o
 * que foi gravado: quem recarrega a trajetória é `fetchPersonalSummary`.
 */
export async function declareMonth(
  situation: SelfReportSituation,
  token: string,
  signal: AbortSignal,
): Promise<void> {
  await requestJson("/me/self-report", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ situation }),
  });
}
