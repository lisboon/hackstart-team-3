"use client";

import { useId, useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { SupportChannels } from "./support-channels";

/**
 * Apoio alcançável de qualquer tela, e não só quando o humor indica sofrimento:
 * a página 3 do desafio cobra utilização dos recursos de apoio, e recurso que
 * aparece apenas no pior dia não é recurso disponível.
 *
 * O painel, o Escape e o foco no título vivem em `components/ui/sheet.tsx`, que
 * é o mesmo usado pelos painéis de Configurações. Aqui fica o que é desta aba: o
 * gatilho no rodapé e a devolução do foco para ele ao fechar.
 */
export function SupportSheet() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

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
        <Sheet id={id} title="Com quem falar" onClose={close}>
          <SupportChannels />
        </Sheet>
      )}
    </>
  );
}
