"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { login, type AuthUser } from "@/services/auth/auth-service";
import type { LoginValues } from "@/schemas/auth";

const TOKEN_KEY = "colheita_token";
const USER_KEY = "colheita_user";

/**
 * A sessão é um store de módulo, não estado de componente, pelo mesmo motivo do
 * tema em `hooks/theme/use-theme.ts`: ela é lida em lugares que não se conhecem.
 * A `TabBar` mora na moldura, o `AuthGate` mora dentro dela, e o "Sair" mora em
 * Configurações, três níveis abaixo. Com `useState` cada um teria a sua cópia, e
 * sair numa tela deixaria a barra de navegação acesa até alguém remontar a
 * árvore — o que navegar com `next/link` não faz.
 *
 * O snapshot lê o `sessionStorage` a cada chamada em vez de guardar o valor:
 * assim a sessão que o teste escreve direto no storage, ou que outra aba
 * encerra, é vista sem depender de ninguém avisar.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function announce() {
  for (const notify of listeners) notify();
}

function readKey(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    // Navegador com storage bloqueado: a sessão vale só para esta página.
    return null;
  }
}

function writeKey(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Sem storage o login ainda funciona; só não sobrevive ao refresh.
  }
}

function clearKeys() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // Nada a limpar se nunca houve storage.
  }
}

function tokenSnapshot(): string {
  return readKey(TOKEN_KEY) ?? "";
}

/**
 * `useSyncExternalStore` compara o snapshot por identidade e entra em laço se
 * receber um objeto novo a cada render. O usuário é um objeto, então o parse
 * fica memoizado pela string de origem: mesmo texto, mesma referência.
 */
let parsedFrom: string | null = null;
let parsedUser: AuthUser | null = null;

function userSnapshot(): AuthUser | null {
  const raw = readKey(USER_KEY);
  if (raw !== parsedFrom) {
    parsedFrom = raw;
    try {
      parsedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      parsedUser = null;
    }
  }
  return parsedUser;
}

/** No servidor não há storage, e afirmar que há faria a tela piscar ao hidratar. */
const noToken = () => "";
const noUser = () => null;
const hydrated = () => true;
const notHydrated = () => false;

export function useAuth() {
  const token = useSyncExternalStore(subscribe, tokenSnapshot, noToken);
  const user = useSyncExternalStore(subscribe, userSnapshot, noUser);
  const isInitialized = useSyncExternalStore(
    subscribe,
    hydrated,
    notHydrated,
  );

  // Erro e "em andamento" são da tentativa de login desta tela, não da sessão:
  // duas árvores não deveriam herdar a mensagem de erro uma da outra.
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
    setError("");
    setPending(false);
    clearKeys();
    announce();
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
        writeKey(TOKEN_KEY, session.accessToken);
        writeKey(USER_KEY, JSON.stringify(session.user));
        announce();
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
