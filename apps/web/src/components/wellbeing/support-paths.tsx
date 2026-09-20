"use client";

import { useEffect, useId, useRef } from "react";
import { Card } from "@/components/ui/card";

/**
 * Acolhe, e só. Não pergunta o motivo, não pede relato, não oferece campo de
 * texto nem lista de canais: investigar sofrimento faria a pessoa parar de
 * marcar. O card diz apenas que hoje não precisa ser produtivo e agradece —
 * os canais de apoio vivem no Perfil (ver SafetyFooter).
 *
 * `takeFocus` só é verdadeiro quando o acolhimento nasce em resposta ao toque.
 * Num dia já respondido ele aparece no carregamento, e roubar o foco aí seria
 * desorientar quem não pediu nada.
 */
export function SupportPaths({ takeFocus }: { takeFocus: boolean }) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takeFocus) heading.current?.focus();
  }, [takeFocus]);

  return (
    <Card aria-labelledby={id} className="rounded-none">
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
    </Card>
  );
}
