import { requestJson } from "@/lib/http/client";
import {
  unitIndicatorsSchema,
  type UnitIndicators,
} from "@/schemas/organization";

/**
 * Só `ADMIN`. A unidade sai da sessão: não existe parâmetro de empresa, e o
 * mês é o do relógio do servidor.
 */
export async function fetchUnitIndicators(
  token: string,
  signal: AbortSignal,
): Promise<UnitIndicators> {
  const result = await requestJson("/organizations/current/indicators", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const indicators = unitIndicatorsSchema.safeParse(result);
  if (!indicators.success)
    throw new Error("O serviço retornou indicadores inválidos.");
  return indicators.data;
}
