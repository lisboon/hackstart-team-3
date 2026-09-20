"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { ICON_STROKE } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Toast as ToastData, ToastTone } from "@/lib/toast";

const ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

/**
 * O tom pinta o ícone e a faixa da esquerda, nunca o texto.
 *
 * `--brand` é o Verde Sicredi, e ele dá 3.19:1 sobre o cartão claro: passa como
 * indicador (WCAG 1.4.11 pede 3:1) e reprova como letra (1.4.3 pede 4.5:1).
 * Deixando o título sempre em `--foreground`, o aviso continua legível mesmo
 * quando o tom é o mais fraco dos quatro — e é justamente num aviso de erro que
 * a legibilidade não pode depender da cor.
 *
 * O ícone acompanha o tom para que a distinção não seja só cromática, como
 * pede a 1.4.1.
 */
const TONES: Record<ToastTone, string> = {
  success: "border-l-primary text-primary",
  error: "border-l-destructive text-destructive",
  info: "border-l-brand text-brand",
  warning: "border-l-warning text-warning",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  const Icon = ICONS[toast.tone];

  return (
    <div
      className={cn(
        "animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-border bg-card px-4 py-3 shadow-lg",
        TONES[toast.tone],
      )}
    >
      <Icon
        aria-hidden
        className="mt-0.5 size-5 shrink-0"
        strokeWidth={ICON_STROKE}
      />
      <div className="grid flex-1 gap-0.5">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar aviso"
        className="-mr-1 -mt-1 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X aria-hidden className="size-4" strokeWidth={ICON_STROKE} />
      </button>
    </div>
  );
}
