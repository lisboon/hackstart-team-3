"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http/client";
import { runAi } from "@/services/ai/ai-service";

export function useAiRun(token: string, onUnauthorized: () => void) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("Pronto para executar.");
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [token],
  );

  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setPending(false);
    setStatus("Execução cancelada");
  }, []);

  async function run(prompt: string) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setAnswer("");
    setStatus("Executando IA…");
    try {
      const result = await runAi(prompt, token, controller.signal, (delta) => {
        if (active.current === controller)
          setAnswer((current) => current + delta);
      });
      if (active.current === controller) {
        setAnswer(result);
        setStatus("Execução concluída");
      }
    } catch (cause) {
      if (active.current !== controller) return;
      if (cause instanceof HttpError && cause.status === 401) onUnauthorized();
      else
        setStatus(
          cause instanceof Error ? cause.message : "Falha na execução.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }

  return { answer, status, pending, run, cancel };
}
