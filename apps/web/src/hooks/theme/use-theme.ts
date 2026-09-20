"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_KEY = "colheita_theme";

const listeners = new Set<() => void>();
let current: Theme | null = null;

function read(): Theme {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot(): Theme {
  if (current === null) current = read();
  return current;
}

/**
 * No servidor não há tema conhecido, e chutar um faria a tela trocar de cor
 * depois da hidratação.
 */
function serverSnapshot(): Theme | null {
  return null;
}

/**
 * As duas classes são explícitas de propósito. Só `dark` não bastaria: quem
 * está no sistema escuro e escolhe claro precisa de algo que vença a media
 * query, e a ausência de classe significa "siga o sistema".
 */
function paint(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const apply = useCallback((next: Theme) => {
    current = next;
    paint(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // A troca vale para esta sessão mesmo sem conseguir guardar.
    }
    for (const notify of listeners) notify();
  }, []);

  return { theme, apply };
}
