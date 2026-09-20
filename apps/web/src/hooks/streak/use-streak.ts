"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { fetchStreak } from "@/services/streak/streak-service";
import type { Streak } from "@/schemas/streak";

/**
 * Leitura da ofensiva, no molde de `useJourney`: um `AbortController` por
 * leitura, 401 devolve ao acesso. Só lê — nada aqui grava.
 */
export function useStreak(token: string, onUnauthorized: () => void) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reading = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  const load = useCallback(
    (controller: AbortController) =>
      fetchStreak(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setStreak(next);
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
              : "Falha ao carregar a ofensiva.",
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

  return { streak, error, loading };
}
