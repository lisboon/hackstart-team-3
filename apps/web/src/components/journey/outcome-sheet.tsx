"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Source } from "@/components/journey/daily-card";
import type { PieceAnswer } from "@/schemas/wellbeing";

/**
 * A consequência da escolha, chegando como momento em vez de como parágrafo.
 *
 * Até aqui o `outcome` só trocava o texto do cartão no lugar: a pessoa tocava
 * e a tela mudava sem avisar que algo tinha acontecido. É o que faz uma lição
 * parecer formulário. A folha sobe por cima da pergunta e dá ao toque uma
 * resposta.
 *
 * **Nunca diz certo nem errado.** O produto não é quiz: a consequência aparece
 * qualquer que seja a escolha, e escolher diferente do que a peça ensinou não é
 * erro em lugar nenhum da tela (regra 6 do `CLAUDE.md`). Por isso não há cor de
 * acerto, ícone de falha, nem "tentar de novo".
 *
 * Não é `ui/sheet.tsx`: aquele é um painel de tela cheia com foco preso, para
 * quando há conteúdo alcançável atrás. Aqui não há — a pergunta atrás já foi
 * respondida e está desativada, e o único caminho é seguir.
 */
export function OutcomeSheet({
  answer,
  choice,
  onContinue,
}: {
  answer: PieceAnswer;
  /** O rótulo que a pessoa tocou, devolvido a ela com as palavras dela. */
  choice: string | null;
  onContinue: () => void;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  // Sem mover o foco, quem usa leitor de tela não saberia que a folha subiu.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div
      role="group"
      aria-labelledby={id}
      className="animate-sheet-up absolute inset-x-0 bottom-0 z-10 grid gap-3 rounded-t-3xl border-t border-border bg-card px-5 pb-6 pt-5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]"
    >
      {/* A alça: diz que isto subiu, sem precisar de palavra. */}
      <span
        aria-hidden
        className="mx-auto h-1 w-10 rounded-full bg-border"
      />

      <h2
        id={id}
        ref={heading}
        tabIndex={-1}
        className="text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Você escolheu
      </h2>

      {choice && (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm font-medium">
          {choice}
        </p>
      )}

      <p role="status" className="text-sm leading-relaxed">
        {answer.outcome}
      </p>

      <Source href={answer.sourceUrl} />

      <Button
        type="button"
        className="w-full py-3.5 text-[15px] font-extrabold uppercase tracking-wide shadow-[0_4px_0_0_color-mix(in_srgb,var(--primary)_60%,black)] transition-all active:translate-y-1 active:shadow-none"
        onClick={onContinue}
      >
        Continuar
      </Button>
    </div>
  );
}
