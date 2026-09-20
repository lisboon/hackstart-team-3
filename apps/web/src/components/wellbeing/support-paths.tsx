"use client";

import { useEffect, useId, useRef } from "react";
import { Card } from "@/components/ui/card";
import { SupportChannels } from "./support-channels";

/**
 * Acolhe e encaminha. Não pergunta o motivo, não pede relato e não oferece
 * campo de texto: investigar sofrimento faria a pessoa parar de marcar. Vive no
 * final do Perfil, sempre alcançável — não só no pior dia.
 *
 * `takeFocus` só é verdadeiro quando o acolhimento nasce em resposta a uma ação;
 * no Perfil ele aparece no carregamento, e roubar o foco aí seria desorientar
 * quem não pediu nada.
 */
export function SupportPaths({ takeFocus = false }: { takeFocus?: boolean }) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takeFocus) heading.current?.focus();
  }, [takeFocus]);

  return (
    <Card aria-labelledby={id} className="rounded-b-2xl">
      <h2
        id={id}
        ref={heading}
        tabIndex={-1}
        className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Hoje não precisa ser produtivo
      </h2>
      <p className="text-sm text-muted-foreground">
        Obrigado por dizer. Você não precisa explicar nada.
      </p>
      <div className="grid gap-3">
        <SupportChannels />
      </div>
    </Card>
  );
}
