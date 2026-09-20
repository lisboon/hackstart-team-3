"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SupportChannels } from "./support-channels";

/**
 * Acolhe e encaminha. Não pergunta o motivo, não pede relato e não oferece
 * campo de texto: investigar sofrimento faria a pessoa parar de marcar.
 *
 * `takeFocus` só é verdadeiro quando o acolhimento nasce em resposta ao toque.
 * Num dia já respondido ele aparece no carregamento, e roubar o foco aí seria
 * desorientar quem não pediu nada.
 */
export function SupportPaths({
  lessonSkipped,
  takeFocus,
  onSkipLesson,
  onResumeLesson,
}: {
  lessonSkipped: boolean;
  takeFocus: boolean;
  onSkipLesson: () => void;
  onResumeLesson: () => void;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takeFocus) heading.current?.focus();
  }, [takeFocus]);

  return (
    <Card aria-labelledby={id}>
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
      {lessonSkipped ? (
        <div className="grid gap-2">
          <p className="text-sm">Combinado: hoje sem lição.</p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:justify-self-start"
            onClick={onResumeLesson}
          >
            Mudei de ideia
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto sm:justify-self-start"
          onClick={onSkipLesson}
        >
          Pular a lição de hoje
        </Button>
      )}
      <div className="grid gap-3">
        <SupportChannels />
      </div>
    </Card>
  );
}
