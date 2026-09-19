"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { login, type AuthSession, type AuthUser } from "@/services/auth/auth-service";
import type { LoginValues } from "@/schemas/auth";

export function useAuth() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem("colheita_token");
      const storedUser = sessionStorage.getItem("colheita_user");
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      // ignore parsing errors
    } finally {
      setIsInitialized(true);
    }
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
    sessionStorage.removeItem("colheita_token");
    sessionStorage.removeItem("colheita_user");
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
        sessionStorage.setItem("colheita_token", session.accessToken);
        sessionStorage.setItem("colheita_user", JSON.stringify(session.user));
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
