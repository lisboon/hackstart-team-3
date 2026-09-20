"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { fetchProfile, type ProfileData } from "@/services/profile/profile-service";

/**
 * Carrega a unidade, a trilha e o resumo — as fontes das conquistas derivadas.
 * Só lê: nenhuma das rotas grava nada. O padrão de aborto e de 401 segue
 * `usePersonalSummary`; o estado é tocado apenas nos callbacks da promise, para
 * não encadear renders dentro do efeito.
 */
export function useProfile(token: string, onUnauthorized: () => void) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reading = useRef<AbortController | null>(null);
  const unauthorized = useRef(onUnauthorized);

  useEffect(() => {
    unauthorized.current = onUnauthorized;
  }, [onUnauthorized]);

  const load = useCallback(
    (controller: AbortController) =>
      fetchProfile(token, controller.signal)
        .then((next) => {
          if (reading.current === controller) setData(next);
        })
        .catch((cause: unknown) => {
          if (reading.current !== controller || controller.signal.aborted)
            return;
          if (cause instanceof HttpError && cause.status === 401) {
            unauthorized.current();
            return;
          }
          setError(
            cause instanceof Error ? cause.message : "Falha ao carregar o perfil.",
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

  return { data, error, loading, reload };
}
