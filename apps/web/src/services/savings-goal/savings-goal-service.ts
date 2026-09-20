import { requestJson } from "@/lib/http/client";
import {
  createdGoalSchema,
  goalsSchema,
  updatedGoalSchema,
  type CreatedGoal,
  type Goals,
  type SavingsGoalKind,
  type SavingsGoalUnmetReason,
  type UpdatedGoal,
} from "@/schemas/savings-goal";

export async function fetchGoals(
  token: string,
  signal: AbortSignal,
): Promise<Goals> {
  const result = await requestJson("/me/goals", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const parsed = goalsSchema.safeParse(result);
  if (!parsed.success) throw new Error("O serviço retornou metas inválidas.");
  return parsed.data;
}

/**
 * Cria a meta. Só `kind` e, para ENDURING, `targetMonths` — mês e identidade
 * saem da sessão e do relógio do servidor. Nenhum valor em dinheiro.
 */
export async function createGoal(
  input: { kind: SavingsGoalKind; targetMonths?: number },
  token: string,
  signal: AbortSignal,
): Promise<CreatedGoal> {
  const result = await requestJson("/me/goals", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const parsed = createdGoalSchema.safeParse(result);
  if (!parsed.success)
    throw new Error("O serviço retornou uma resposta inválida.");
  return parsed.data;
}

export async function extendGoal(
  id: string,
  targetMonths: number,
  token: string,
  signal: AbortSignal,
): Promise<UpdatedGoal> {
  return patchGoal(id, { action: "EXTEND", targetMonths }, token, signal);
}

export async function endGoal(
  id: string,
  unmetReason: SavingsGoalUnmetReason | undefined,
  token: string,
  signal: AbortSignal,
): Promise<UpdatedGoal> {
  return patchGoal(id, { action: "END", unmetReason }, token, signal);
}

async function patchGoal(
  id: string,
  body: Record<string, unknown>,
  token: string,
  signal: AbortSignal,
): Promise<UpdatedGoal> {
  const result = await requestJson(`/me/goals/${id}`, {
    method: "PATCH",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const parsed = updatedGoalSchema.safeParse(result);
  if (!parsed.success)
    throw new Error("O serviço retornou uma resposta inválida.");
  return parsed.data;
}
