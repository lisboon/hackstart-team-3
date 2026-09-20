"use client";

import { useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { answerPiece } from "@/services/wellbeing/wellbeing-service";
import type { PieceAnswer } from "@/schemas/wellbeing";

export type AnswerResult =
  | { status: "answered"; answer: PieceAnswer }
  | { status: "error" };

/**
 * Responder a peça a partir da trilha (`POST /me/today/answer`).
 *
 * Colheita e humor são independentes: o backend abre o dia com humor neutro
 * automático quando a pessoa responde sem ter declarado o humor, e o humor
 * real declarado depois o sobrescreve (issue #64). Por isso aqui não há mais
 * contorno de 409 por falta de humor — responder simplesmente funciona.
 */
export function useAnswerPiece(token: string, onUnauthorized: () => void) {
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<PieceAnswer | null>(null);
  const writing = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  async function decide(
    contentPieceId: string,
    label: string,
  ): Promise<AnswerResult> {
    if (writing.current) return { status: "error" };
    const controller = new AbortController();
    writing.current = controller;
    setPending(true);
    try {
      const result = await answerPiece(
        contentPieceId,
        label,
        token,
        controller.signal,
      );
      if (writing.current !== controller) return { status: "error" };
      setAnswer(result);
      return { status: "answered", answer: result };
    } catch (cause) {
      if (writing.current !== controller || controller.signal.aborted)
        return { status: "error" };
      if (cause instanceof HttpError && cause.status === 401) {
        unauthorized.current();
      }
      return { status: "error" };
    } finally {
      if (writing.current === controller && !controller.signal.aborted) {
        writing.current = null;
        setPending(false);
      }
    }
  }

  function reset() {
    setAnswer(null);
  }

  return { decide, pending, answer, reset };
}
