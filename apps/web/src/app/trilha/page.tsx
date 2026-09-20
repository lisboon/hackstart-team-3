"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { Button } from "@/components/ui/button";
import { JourneyMap } from "@/components/journey/journey-map";
import { AnsweredPieceReview } from "@/components/journey/answered-piece-review";
import { DailyCard } from "@/components/journey/daily-card";
import { useJourney } from "@/hooks/wellbeing/use-journey";
import { useAnswerPiece } from "@/hooks/wellbeing/use-answer-piece";
import type { ContentPiece, JourneyNode } from "@/schemas/wellbeing";

/** O nó atual carrega tudo que a pergunta precisa; vira a peça respondível. */
function toPiece(node: JourneyNode): ContentPiece {
  return {
    id: node.id,
    stage: node.stage,
    title: node.title,
    body: node.body ?? "",
    prompt: node.prompt ?? "",
    options: node.options ?? [],
    sourceUrl: node.sourceUrl,
  };
}

function TrilhaPageContent({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { journey, error, loading, reload } = useJourney(token, onUnauthorized);
  const { decide, pending, answer, reset } = useAnswerPiece(
    token,
    onUnauthorized,
  );
  // Duas sub-telas possíveis, sem rota: releitura de peça concluída, ou a
  // pergunta da peça atual. `null` mostra o mapa.
  const [reviewing, setReviewing] = useState<JourneyNode | null>(null);
  const [answering, setAnswering] = useState<JourneyNode | null>(null);

  function openNode(node: JourneyNode) {
    if (node.state === "answered") setReviewing(node);
    // Clicar na colheita de hoje abre a pergunta ali mesmo.
    if (node.state === "current") {
      reset();
      setAnswering(node);
    }
  }

  async function onDecide(pieceId: string, label: string) {
    const result = await decide(pieceId, label);
    // Responder atualiza a colheita: recarrega o mapa, e o nó vira concluído.
    // Se faltava o humor, o hook abriu o dia por baixo (contorno #64) — aqui
    // não há mais barreira a tratar.
    if (result.status === "answered") await reload();
  }

  function backToMap() {
    setReviewing(null);
    setAnswering(null);
    reset();
  }

  if (error) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (loading || !journey) {
    return (
      <div className="grid flex-1 animate-pulse place-items-center p-6 text-muted-foreground">
        Carregando trilha...
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="mx-auto w-full max-w-md pb-24">
        <AnsweredPieceReview node={reviewing} onBack={backToMap} />
      </div>
    );
  }

  if (answering) {
    return (
      <div className="mx-auto grid w-full max-w-md gap-4 pb-24">
        <DailyCard
          piece={toPiece(answering)}
          answer={answer}
          pending={pending}
          onDecide={(label) => void onDecide(answering.id, label)}
        />
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto sm:justify-self-start"
          onClick={backToMap}
        >
          {answer ? "Voltar à trilha" : "Cancelar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md pb-24">
      <header className="px-1 pb-4 pt-2">
        <h1 className="font-serif text-[1.2rem] leading-tight">Trilha COOPS</h1>
      </header>
      <JourneyMap nodes={journey.nodes} onOpen={openNode} />
    </div>
  );
}

export default function TrilhaPage() {
  return (
    <AuthGate>
      {({ token, onUnauthorized }) => (
        <AppShell>
          <TrilhaPageContent token={token} onUnauthorized={onUnauthorized} />
        </AppShell>
      )}
    </AuthGate>
  );
}
