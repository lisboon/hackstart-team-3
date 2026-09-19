"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import {
  fetchToday,
  recordMood,
} from "@/services/wellbeing/wellbeing-service";
import type { DailyEntry, MoodScale } from "@/schemas/wellbeing";

export function useDailyMood(token: string, onUnauthorized: () => void) {
  const [today, setToday] = useState<DailyEntry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const reading = useRef<AbortController | null>(null);
  const writing = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  /**
   * O estado é tocado só dentro dos callbacks da promise: setState síncrono
   * dentro de um efeito encadeia renders.
   */
  const load = useCallback(
    (controller: AbortController) =>
      fetchToday(token, controller.signal)
        .then((entry) => {
          if (reading.current === controller) setToday(entry);
        })
        .catch((cause: unknown) => {
          if (reading.current !== controller || controller.signal.aborted)
            return;
          if (cause instanceof HttpError && cause.status === 401) {
            unauthorized.current();
            return;
          }
          setError(
            cause instanceof Error ? cause.message : "Falha ao carregar o dia.",
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

  useEffect(
    () => () => {
      writing.current?.abort();
      writing.current = null;
    },
    [],
  );

  const reload = useCallback(async () => {
    reading.current?.abort();
    const controller = new AbortController();
    reading.current = controller;
    setLoading(true);
    setError("");
    await load(controller);
  }, [load]);

  /**
   * O 409 não é erro para quem responde: significa que o dia já foi respondido,
   * por toque duplo ou corrida. Recarregar mostra o app em vez de acusar.
   */
  async function record(mood: MoodScale): Promise<boolean> {
    if (writing.current) return false;
    const controller = new AbortController();
    writing.current = controller;
    setPending(true);
    setError("");
    try {
      const entry = await recordMood(mood, token, controller.signal);
      if (writing.current !== controller) return false;
      setToday(entry);
      return true;
    } catch (cause) {
      if (writing.current !== controller || controller.signal.aborted)
        return false;
      if (cause instanceof HttpError && cause.status === 401) {
        unauthorized.current();
        return false;
      }
      if (cause instanceof HttpError && cause.status === 409) {
        await reload();
        return true;
      }
      setError(
        cause instanceof Error ? cause.message : "Falha ao registrar o humor.",
      );
      return false;
    } finally {
      if (writing.current === controller && !controller.signal.aborted) {
        writing.current = null;
        setPending(false);
      }
    }
  }

  return { today, error, loading, pending, record, reload };
}
