"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import {
  createGoal,
  endGoal,
  extendGoal,
  fetchGoals,
} from "@/services/savings-goal/savings-goal-service";
import type {
  Goals,
  SavingsGoalKind,
  SavingsGoalUnmetReason,
} from "@/schemas/savings-goal";

/**
 * Metas de guarda da pessoa. A leitura segue o molde de `usePersonalSummary`
 * (aborto por leitura, 401 devolve ao acesso). As escritas — criar, estender,
 * encerrar — recarregam a lista, já que o progresso é derivado no servidor.
 */
export function useGoals(token: string, onUnauthorized: () => void) {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const reading = useRef<AbortController | null>(null);
  const writing = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  const load = useCallback(
    (controller: AbortController) =>
      fetchGoals(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setGoals(next);
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
              : "Falha ao carregar as metas.",
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

  const write = useCallback(
    async (action: (signal: AbortSignal) => Promise<unknown>) => {
      if (writing.current) return false;
      const controller = new AbortController();
      writing.current = controller;
      setPending(true);
      setError("");
      try {
        await action(controller.signal);
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
          cause instanceof Error ? cause.message : "Falha ao salvar a meta.",
        );
        return false;
      } finally {
        if (writing.current === controller && !controller.signal.aborted) {
          writing.current = null;
          setPending(false);
        }
      }
    },
    [reload],
  );

  const create = useCallback(
    (kind: SavingsGoalKind, targetMonths?: number) =>
      write((signal) => createGoal({ kind, targetMonths }, token, signal)),
    [write, token],
  );

  const extend = useCallback(
    (id: string, targetMonths: number) =>
      write((signal) => extendGoal(id, targetMonths, token, signal)),
    [write, token],
  );

  const end = useCallback(
    (id: string, reason?: SavingsGoalUnmetReason) =>
      write((signal) => endGoal(id, reason, token, signal)),
    [write, token],
  );

  return { goals, error, loading, pending, create, extend, end, reload };
}
