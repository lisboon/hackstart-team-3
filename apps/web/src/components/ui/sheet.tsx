"use client";

import type React from "react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Painel que cobre a moldura do app, com título, fechar e Escape.
 *
 * É controlado em React em vez de `dialog.showModal()` porque o jsdom desta
 * versão não implementa `showModal` — o portão de teste não conseguiria
 * exercitar nenhum painel do produto. Por isso o mínimo de teclado vive aqui, em
 * um lugar só: Escape fecha e o foco entra no título ao abrir. Devolver o foco
 * ao gatilho é de quem abriu, que é quem tem a referência dele.
 *
 * `absolute inset-0` e não `fixed`: a moldura de celular é o mundo do app, e um
 * painel `fixed` escaparia dela no desktop.
 *
 * Monte só quando aberto. O foco entra no título no efeito de montagem, e um
 * painel que existe escondido não teria esse momento.
 */
/**
 * O que conta como parada de tabulação dentro do painel. Lista curta de
 * propósito: é o que os painéis deste app usam de fato.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({
  id,
  title,
  onClose,
  children,
  className,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  /**
   * `aria-modal="true"` promete que nada fora do painel é alcançável, e sem
   * prender a tabulação a promessa é falsa: do último campo do formulário de
   * senha o Tab cairia na lista de Configurações atrás, que continua desenhada.
   *
   * O ciclo é feito à mão porque o painel não é um `<dialog>` nativo — o jsdom
   * desta versão não implementa `showModal`, e sem ele nenhum painel do produto
   * seria testável.
   */
  function trap(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const stops = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!stops || stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === heading.current)) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      id={id}
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
          return;
        }
        trap(event);
      }}
      className={cn(
        "absolute inset-0 z-10 flex flex-col bg-background",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <h2
          id={`${id}-title`}
          ref={heading}
          tabIndex={-1}
          className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-lg px-2 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Fechar
        </button>
      </div>
      <div className="grid gap-3 overflow-y-auto px-5 py-4">{children}</div>
    </div>
  );
}
