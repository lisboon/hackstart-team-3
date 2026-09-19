"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { login } from "@/services/auth/auth-service";
import type { LoginValues } from "@/schemas/auth";

export function useAuth() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );

  const logout = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setToken("");
    setError("");
    setPending(false);
  }, []);

  async function signIn(values: LoginValues) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError("");
    try {
      const nextToken = await login(values, controller.signal);
      if (active.current === controller) setToken(nextToken);
    } catch (cause) {
      if (active.current === controller && !controller.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : "Falha ao autenticar.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }

  return { token, error, pending, signIn, logout };
}
