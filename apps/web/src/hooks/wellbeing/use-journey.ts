"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { fetchJourney } from "@/services/wellbeing/wellbeing-service";
import type { Journey } from "@/schemas/wellbeing";

/**
 * Leitura da trilha inteira, no mesmo molde de `usePersonalSummary`: um
 * `AbortController` por leitura, 401 devolve ao acesso, e `reload` reflete o
 * dia depois que a peça atual é respondida.
 */
export function useJourney(token: string, onUnauthorized: () => void) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reading = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  const load = useCallback(
    (controller: AbortController) =>
      fetchJourney(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setJourney(next);
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
              : "Falha ao carregar a trilha.",
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

  const reload = useCallback(async () => {
    reading.current?.abort();
    const controller = new AbortController();
    reading.current = controller;
    setLoading(true);
    setError("");
    await load(controller);
  }, [load]);

  return { journey, error, loading, reload };
}
