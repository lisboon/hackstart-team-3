"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Source } from "@/components/journey/daily-card";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { JourneyNode } from "@/schemas/wellbeing";

/**
 * A releitura de uma peça já respondida. É só leitura: mostra o que a pessoa
 * escolheu e a consequência daquela escolha, sem reabrir as opções. Escolher
 * de novo não é permitido pela regra — a decisão do dia não se refaz.
 */
export function AnsweredPieceReview({
  node,
  onBack,
}: {
  node: JourneyNode;
  onBack: () => void;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  // Ao abrir a releitura, o foco vai ao título: quem usa leitor de tela
  // precisa saber que a tela trocou.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Card aria-labelledby={id}>
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {STAGE_LABEL[node.stage]}
      </p>
      <h2
        id={id}
        ref={heading}
        tabIndex={-1}
        className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {node.title}
      </h2>

      {node.answer && (
        <p className="text-sm">
          <span className="text-muted-foreground">Você escolheu: </span>
          <span className="font-medium">{node.answer}</span>
        </p>
      )}

      {node.outcome && (
        <p className="text-sm leading-relaxed">{node.outcome}</p>
      )}

      <Source href={node.sourceUrl} />

      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto sm:justify-self-start"
        onClick={onBack}
      >
        Voltar à trilha
      </Button>
    </Card>
  );
}
