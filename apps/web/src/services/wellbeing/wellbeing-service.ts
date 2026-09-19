import { requestJson } from "@/lib/http/client";
import {
  dailyEntrySchema,
  moodRecordSchema,
  pieceAnswerSchema,
  type DailyEntry,
  type MoodScale,
  type PieceAnswer,
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
 * Uma resposta por dia, sem correção. O 201 confirma o humor, mas não traz a
 * peça — quem chama recarrega o dia para recebê-la. O 409 é rede de segurança
 * para toque duplo e fica a cargo de quem chama.
 */
export async function recordMood(
  mood: MoodScale,
  token: string,
  signal: AbortSignal,
): Promise<void> {
  const result = await requestJson("/me/today/mood", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mood }),
  });
  if (!moodRecordSchema.safeParse(result).success)
    throw new Error("O serviço retornou uma resposta inválida.");
}

/**
 * A decisão sobre a peça do dia. `answer` é o rótulo exato da opção escolhida;
 * o servidor é quem sabe o que ela significa.
 */
export async function answerPiece(
  contentPieceId: string,
  answer: string,
  token: string,
  signal: AbortSignal,
): Promise<PieceAnswer> {
  const result = await requestJson("/me/today/answer", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentPieceId, answer }),
  });
  const parsed = pieceAnswerSchema.safeParse(result);
  if (!parsed.success)
    throw new Error("O serviço retornou uma resposta inválida.");
  return parsed.data;
}
