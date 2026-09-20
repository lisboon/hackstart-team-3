export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

/**
 * Erro fica mais tempo porque costuma trazer o que fazer a seguir, e aviso
 * fica mais que confirmação porque interrompe algo que a pessoa esperava.
 */
const DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

/** Além disto a pilha vira parede e as mais antigas saem para dar lugar. */
const MAX_VISIBLE = 3;

const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

let toasts: Toast[] = [];
let sequence = 0;

/**
 * O array é trocado por um novo a cada mudança e devolvido por identidade nas
 * leituras. `useSyncExternalStore` compara o snapshot por referência: montar um
 * array novo a cada chamada põe o React em laço infinito.
 */
function commit(next: Toast[]) {
  toasts = next;
  for (const notify of listeners) notify();
}

function clearTimer(id: number) {
  const timer = timers.get(id);
  if (timer === undefined) return;
  clearTimeout(timer);
  timers.delete(id);
}

function schedule(id: number, tone: ToastTone) {
  clearTimer(id);
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      dismiss(id);
    }, DURATION[tone]),
  );
}

export function subscribeToasts(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function toastSnapshot(): Toast[] {
  return toasts;
}

/** No servidor não há fila, e uma lista nova a cada chamada quebraria a hidratação. */
const EMPTY: Toast[] = [];
export function toastServerSnapshot(): Toast[] {
  return EMPTY;
}

export function dismiss(id: number) {
  clearTimer(id);
  const next = toasts.filter((item) => item.id !== id);
  if (next.length !== toasts.length) commit(next);
}

export function dismissAll() {
  for (const id of timers.keys()) clearTimeout(timers.get(id)!);
  timers.clear();
  if (toasts.length > 0) commit([]);
}

function push(tone: ToastTone, title: string, description?: string): number {
  // O mesmo aviso repetido — dois toques na colheita de hoje, duas falhas de
  // rede seguidas — renova o tempo do que já está na tela em vez de empilhar
  // cópias. Empilhar daria a impressão de que aconteceram coisas diferentes.
  const existing = toasts.find(
    (item) =>
      item.tone === tone &&
      item.title === title &&
      item.description === description,
  );
  if (existing) {
    schedule(existing.id, tone);
    return existing.id;
  }

  const id = ++sequence;
  const entry: Toast = { id, tone, title, description };
  const next = [...toasts, entry].slice(-MAX_VISIBLE);
  for (const dropped of toasts) {
    if (!next.includes(dropped)) clearTimer(dropped.id);
  }
  commit(next);
  schedule(id, tone);
  return id;
}

export const toast = {
  success: (title: string, description?: string) =>
    push("success", title, description),
  error: (title: string, description?: string) =>
    push("error", title, description),
  info: (title: string, description?: string) =>
    push("info", title, description),
  warning: (title: string, description?: string) =>
    push("warning", title, description),
  dismiss,
  dismissAll,
};
