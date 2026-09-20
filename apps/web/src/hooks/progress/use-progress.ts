"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { fetchProgress } from "@/services/progress/progress-service";
import type { Progress } from "@/schemas/progress";

/**
 * Leitura do mês, no mesmo molde de `useStreak`: um `AbortController` por
 * leitura, 401 devolve ao acesso. Só lê — nada aqui grava.
 */
export function useProgress(token: string, onUnauthorized: () => void) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reading = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  const load = useCallback(
    (controller: AbortController) =>
      fetchProgress(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setProgress(next);
        })
        .catch((cause: unknown) => {
          if (reading.current !== controller || controller.signal.aborted)
            return;
          if (cause instanceof HttpError && cause.status === 401) {
            unauthorized.current();
            return;
          }
          setError(
            cause instanceof Error
              ? cause.message
              : "Falha ao carregar o progresso.",
          );
        })
        .finally(() => {
          if (reading.current === controller && !controller.signal.aborted) {
            reading.current = null;
            setLoading(false);
          }
        }),
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    reading.current = controller;
    void load(controller);
    return () => {
      controller.abort();
      reading.current = null;
    };
  }, [load]);

  return { progress, error, loading };
}
