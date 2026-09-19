"use client";

import { useId, useState } from "react";
import { useAiRun } from "@/hooks/ai/use-ai-run";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ContentPiece } from "@/schemas/wellbeing";
import { buildExplanationPrompt } from "./explanation-prompt";

/**
 * Reaproveita `useAiRun`, que já trata status, cancelamento e fim sem
 * `completed`. Fica ao lado da peça, e não dentro dela, porque a decisão do dia
 * não depende da explicação em nenhum momento — inclusive quando falha.
 *
 * Parar esconde o texto parcial: meia explicação na tela passaria por
 * explicação. E a falha do provider não chega crua à pessoa: ela é opcional
 * para o dia, então basta dizer em português que não deu, sem alarme.
 */
export function PieceExplanation({
  piece,
  token,
  onUnauthorized,
}: {
  piece: ContentPiece;
  token: string;
  onUnauthorized: () => void;
}) {
  const id = useId();
  const { answer, pending, run, cancel } = useAiRun(
    token,
    onUnauthorized,
  );
  const [asked, setAsked] = useState(false);

  function explain() {
    setAsked(true);
    void run(buildExplanationPrompt(piece));
  }

  function stop() {
    cancel();
    setAsked(false);
  }

  return (
    <Card aria-labelledby={id}>
      <h2 id={id} className="text-base font-semibold">
        Em outras palavras
      </h2>
      {!asked ? (
        <Button
          type="button"
          variant="secondary"
          className="h-auto w-full whitespace-normal py-3 sm:w-auto sm:justify-self-start"
          onClick={explain}
        >
          Explicar esta peça
        </Button>
      ) : (
        <>
          {pending && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              Escrevendo…
            </p>
          )}
          {answer && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
              {answer}
            </p>
          )}
          {!pending && !answer && (
            <p role="alert" className="text-sm text-muted-foreground">
              Não consegui explicar agora. A peça acima continua valendo, e você
              pode tentar de novo depois.
            </p>
          )}
          {pending && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto sm:justify-self-start"
              onClick={stop}
            >
              Parar
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
