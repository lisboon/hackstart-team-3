"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { login, type AuthUser } from "@/services/auth/auth-service";
import type { LoginValues } from "@/schemas/auth";

export function useAuth() {
  const [token, setToken] = useState(() => {
    try {
      return typeof window !== "undefined"
        ? sessionStorage.getItem("colheita_token") || ""
        : "";
    } catch {
      return "";
    }
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const storedUser = sessionStorage.getItem("colheita_user");
        return storedUser ? JSON.parse(storedUser) : null;
      }
    } catch {
      // ignore parsing or storage errors
    }
    return null;
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);

  // Signal hydration completion
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInitialized(true);
  }, []);

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
    setUser(null);
    setError("");
    setPending(false);
    try {
      sessionStorage.removeItem("colheita_token");
      sessionStorage.removeItem("colheita_user");
    } catch {
      // ignore
    }
  }, []);

  async function signIn(values: LoginValues) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError("");
    try {
      const session = await login(values, controller.signal);
      if (active.current === controller) {
        setToken(session.accessToken);
        setUser(session.user);
        try {
          sessionStorage.setItem("colheita_token", session.accessToken);
          sessionStorage.setItem("colheita_user", JSON.stringify(session.user));
        } catch {
          // Without storage the session lives only in memory: lost on refresh,
          // but login still works for the current session.
        }
      }
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

  return { token, user, isInitialized, error, pending, signIn, logout };
}
