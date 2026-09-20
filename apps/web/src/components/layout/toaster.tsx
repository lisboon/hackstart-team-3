"use client";

import { useSyncExternalStore } from "react";
import { Toast } from "@/components/ui/toast";
import {
  dismiss,
  subscribeToasts,
  toastServerSnapshot,
  toastSnapshot,
} from "@/lib/toast";

/**
 * A pilha fica no topo. Embaixo ela disputaria espaço com a barra de abas, que
 * é fixa e já come o `env(safe-area-inset-bottom)` — e cobrir o rodapé do CVV
 * é exatamente o que não pode acontecer num app que coleta sofrimento.
 *
 * `aria-live="polite"` para a região inteira: o leitor de tela termina a frase
 * em curso antes de anunciar. Erro sobe para `assertive` no próprio item,
 * porque interrompe uma ação que a pessoa esperava concluir.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    toastSnapshot,
    toastServerSnapshot,
  );

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto grid w-full max-w-[393px] gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === "error" ? "alert" : "status"}
          aria-live={toast.tone === "error" ? "assertive" : undefined}
        >
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
