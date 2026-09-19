import { requestJson } from "@/lib/http/client";
import {
  dailyEntrySchema,
  moodRecordSchema,
  type DailyEntry,
  type MoodScale,
} from "@/schemas/wellbeing";

export async function fetchToday(
  token: string,
  signal: AbortSignal,
): Promise<DailyEntry> {
  const result = await requestJson("/me/today", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const entry = dailyEntrySchema.safeParse(result);
  if (!entry.success) throw new Error("O serviço retornou um dia inválido.");
  return entry.data;
}

/**
 * Uma resposta por dia, sem correção. O 201 já devolve o dia respondido, então
 * não há segunda ida ao servidor; o 409 é rede de segurança para toque duplo e
 * fica a cargo de quem chama.
 */
export async function recordMood(
  mood: MoodScale,
  token: string,
  signal: AbortSignal,
): Promise<DailyEntry> {
  const result = await requestJson("/me/today/mood", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mood }),
  });
  const record = moodRecordSchema.safeParse(result);
  if (!record.success)
    throw new Error("O serviço retornou uma resposta inválida.");
  return { ...record.data, answered: true };
}
