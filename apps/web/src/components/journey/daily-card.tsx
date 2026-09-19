"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { ContentPiece, PieceAnswer } from "@/schemas/wellbeing";

/**
 * A peça do dia e a decisão sobre ela. Não é quiz: a consequência da escolha
 * aparece qualquer que seja a opção, e escolher diferente do que a peça ensinou
 * não é tratado como erro em lugar nenhum da tela.
 */
export function DailyCard({
  piece,
  answer,
  pending,
  onDecide,
}: {
  piece: ContentPiece;
  answer: PieceAnswer | null;
  pending: boolean;
  onDecide: (label: string) => void;
}) {
  const id = useId();

  if (answer) return <Outcome answer={answer} pieceTitle={piece.title} />;

  return (
    <Card aria-labelledby={`${id}-title`}>
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {STAGE_LABEL[piece.stage]}
      </p>
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {piece.title}
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {piece.body}
      </p>

      <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
        <legend className="text-sm font-medium">{piece.prompt}</legend>
        {piece.options.map((option) => (
          <Button
            key={option.label}
            type="button"
            variant="secondary"
            className="h-auto w-full justify-start whitespace-normal py-3 text-left"
            disabled={pending}
            onClick={() => onDecide(option.label)}
          >
            {option.label}
          </Button>
        ))}
      </fieldset>

      <Source href={piece.sourceUrl} />
    </Card>
  );
}

function Outcome({
  answer,
  pieceTitle,
}: {
  answer: PieceAnswer;
  pieceTitle: string;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  /**
   * A consequência substitui a pergunta no mesmo lugar da tela. Sem mover o
   * foco, quem usa leitor de tela não saberia que o conteúdo trocou.
   */
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
        {pieceTitle}
      </h2>
      <p role="status" className="text-sm leading-relaxed">
        {answer.outcome}
      </p>
      <p className="text-sm text-muted-foreground">
        Sua diária de hoje está completa. Amanhã tem a próxima.
      </p>
      <Source href={answer.sourceUrl} />
    </Card>
  );
}

/** Anexo V 5.V: a orientação precisa dizer de onde veio. */
function Source({ href }: { href: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Conteúdo baseado no{" "}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        Cooperação na Ponta do Lápis
      </a>
      , programa de educação financeira do Sicredi.
    </p>
  );
}
