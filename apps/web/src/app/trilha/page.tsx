"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { Button } from "@/components/ui/button";
import { JourneyMap } from "@/components/journey/journey-map";
import { LessonShell } from "@/components/journey/lesson-shell";
import { AnsweredPieceReview } from "@/components/journey/answered-piece-review";
import { DailyCard } from "@/components/journey/daily-card";
import {
  coopsSections,
  journeyPoints,
} from "@/components/journey/coops-sections";
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

  const sections = coopsSections(journey.nodes);
  const points = journeyPoints(journey.nodes);
  const stagesDone = sections.filter(
    (section) => section.state === "done",
  ).length;

  /** Onde a peça cai dentro da etapa dela, para a barra da lição. */
  function placeOf(node: JourneyNode) {
    const section = sections.find((it) => it.stage === node.stage);
    const position =
      (section?.nodes.findIndex((it) => it.id === node.id) ?? 0) + 1;
    return { position, total: section?.total ?? 1 };
  }

  if (reviewing) {
    const place = placeOf(reviewing);
    return (
      <div className="mx-auto w-full max-w-md pb-24">
        <LessonShell
          stage={reviewing.stage}
          position={place.position}
          total={place.total}
          points={points}
          onClose={backToMap}
        >
          <AnsweredPieceReview node={reviewing} onBack={backToMap} />
        </LessonShell>
      </div>
    );
  }

  if (answering) {
    const place = placeOf(answering);
    return (
      <div className="mx-auto w-full max-w-md pb-24">
        <LessonShell
          stage={answering.stage}
          position={place.position}
          total={place.total}
          points={points}
          onClose={backToMap}
        >
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
        </LessonShell>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md pb-24">
      <header className="flex items-baseline justify-between gap-3 px-1 pb-4 pt-2">
        <h1 className="font-serif text-[1.2rem] leading-tight">Trilha COOPS</h1>
        <p className="shrink-0 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {stagesDone} de {sections.length}
          </span>
          {" · "}
          {/*
            "Pontos acumulados", nunca "saldo": o número é derivado do que a
            pessoa respondeu, não um crédito guardado no servidor. A loja de
            brindes precisa de saldo persistido, e ela ainda não existe — ver
            docs/aderencia-ao-desafio.md.
          */}
          <span className="font-semibold tabular-nums text-achievement-trajectory">
            {points} pontos
          </span>
        </p>
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
