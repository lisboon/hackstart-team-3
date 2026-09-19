"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import {
  declareMonth,
  fetchPersonalSummary,
} from "@/services/financial-health/financial-health-service";
import type {
  PersonalSummary,
  SelfReportSituation,
} from "@/schemas/financial-health";

export function usePersonalSummary(token: string, onUnauthorized: () => void) {
  const [summary, setSummary] = useState<PersonalSummary | null>(null);
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
      fetchPersonalSummary(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setSummary(next);
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
              : "Falha ao carregar o resumo.",
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

  async function declare(situation: SelfReportSituation): Promise<boolean> {
    if (writing.current) return false;
    const controller = new AbortController();
    writing.current = controller;
    setPending(true);
    setError("");
    try {
      await declareMonth(situation, token, controller.signal);
      if (writing.current !== controller) return false;
      await reload();
      return true;
    } catch (cause) {
      if (writing.current !== controller || controller.signal.aborted)
        return false;
      if (cause instanceof HttpError && cause.status === 401) {
        unauthorized.current();
        return false;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "Falha ao registrar a declaração.",
      );
      return false;
    } finally {
      if (writing.current === controller && !controller.signal.aborted) {
        writing.current = null;
        setPending(false);
      }
    }
  }

  return { summary, error, loading, pending, declare, reload };
}
