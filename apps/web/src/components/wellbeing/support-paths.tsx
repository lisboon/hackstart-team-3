"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
  SUPPORT_PATHS,
} from "./mood-presentation";

/**
 * Acolhe e encaminha. Não pergunta o motivo, não pede relato e não oferece
 * campo de texto: investigar sofrimento faria a pessoa parar de marcar.
 */
export function SupportPaths({
  lessonSkipped,
  onSkipLesson,
  onResumeLesson,
}: {
  lessonSkipped: boolean;
  onSkipLesson: () => void;
  onResumeLesson: () => void;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  /** O acolhimento nasce abaixo da escala; sem mover o foco, quem usa leitor de
   * tela não saberia que ele apareceu. */
  useEffect(() => {
    heading.current?.focus();
  }, []);

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
        <p className="text-sm">
          Se quiser falar com alguém, a escolha é sua — inclusive a de não
          falar. O app não avisa ninguém.
        </p>
        <ul className="grid gap-2">
          {SUPPORT_PATHS.map((path) => (
            <li
              key={path.title}
              className="grid min-w-0 gap-1 rounded-xl border border-border p-3"
            >
              <span className="text-sm font-semibold">{path.title}</span>
              <span className="text-sm text-muted-foreground">
                {path.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-1 rounded-xl border border-border bg-muted p-3">
        <a
          href={CRISIS_LINE.href}
          className="text-sm font-semibold text-primary underline underline-offset-4"
        >
          {CRISIS_LINE.label}
        </a>
        <span className="text-sm text-muted-foreground">
          {CRISIS_LINE.detail}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{CARE_DISCLAIMER}</p>
    </Card>
  );
}
