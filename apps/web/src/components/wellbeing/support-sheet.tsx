"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SupportChannels } from "./support-channels";

/**
 * Apoio alcançável de qualquer tela, e não só quando o humor indica sofrimento:
 * a página 3 do desafio cobra utilização dos recursos de apoio, e recurso que
 * aparece apenas no pior dia não é recurso disponível.
 *
 * O painel é controlado em React em vez de `dialog.showModal()` porque o jsdom
 * desta versão não implementa `showModal` — o portão de teste não conseguiria
 * exercitar a aba. Por isso o mínimo de teclado vive aqui: Escape fecha, o foco
 * entra no título ao abrir e volta para o gatilho ao fechar.
 */
export function SupportSheet() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-lg px-1 text-left text-sm font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Com quem falar — apoio disponível
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          className="absolute inset-0 z-10 flex flex-col bg-background"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <h2
              id={`${id}-title`}
              ref={heading}
              tabIndex={-1}
              className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Com quem falar
            </h2>
            <button
              type="button"
              onClick={close}
              className="min-h-11 min-w-11 rounded-lg px-2 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Fechar
            </button>
          </div>
          <div className="grid gap-3 overflow-y-auto px-5 py-4">
            <SupportChannels />
          </div>
        </div>
      )}
    </>
  );
}
