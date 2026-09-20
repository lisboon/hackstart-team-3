"use client";

import { useId, useState } from "react";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/components/ui/icon";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import { OutcomeSheet } from "@/components/journey/outcome-sheet";
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
  onContinue,
}: {
  piece: ContentPiece;
  answer: PieceAnswer | null;
  pending: boolean;
  onDecide: (label: string) => void;
  /** O que fazer quando a pessoa fecha a folha da consequência. */
  onContinue?: () => void;
}) {
  const id = useId();
  const [chosen, setChosen] = useState<string | null>(null);

  function choose(label: string) {
    // Guardar o rótulo aqui é o que permite devolvê-lo na folha com as
    // palavras que a pessoa tocou; o servidor só responde a consequência.
    setChosen(label);
    onDecide(label);
  }

  return (
    <div className="relative">
      <Card aria-labelledby={`${id}-title`}>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
        <span>{STAGE_LABEL[piece.stage]}</span>
        {/* Ponto que pulsa: a marca de "é esta, agora". O bloco de movimento
            reduzido em globals.css cobre o `animate-ping` embutido. */}
        <span aria-hidden className="relative flex size-2">
          <span className="animate-ping absolute inline-flex size-full rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
      </p>
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {piece.title}
      </h2>

      {/* O contexto da peça num bloco próprio, com o broto: é leitura, não
          pergunta, e separar as duas coisas é o que faz a decisão saltar. */}
      <div className="flex items-start gap-3 rounded-2xl bg-muted p-3.5">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
        >
          <Sprout className="size-6" strokeWidth={ICON_STROKE} />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {piece.body}
        </p>
      </div>

      <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
        <legend className="mb-1 text-base font-bold leading-snug">
          {piece.prompt}
        </legend>
        {piece.options.map((option, index) => (
          <Button
            key={option.label}
            type="button"
            variant="secondary"
            // O relevo do mockup: a opção afunda ao ser tocada. Um toque
            // decide — não há confirmação depois, e por isso não há estado
            // "selecionada" a desenhar.
            className="h-auto w-full justify-start gap-3 whitespace-normal rounded-2xl border-2 p-4 text-left shadow-[0_3px_0_0_var(--border)] transition-all active:translate-y-[3px] active:shadow-none"
            disabled={pending || answer !== null}
            onClick={() => choose(option.label)}
          >
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-md border border-border text-[11px] font-bold text-muted-foreground"
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="min-w-0 flex-1">{option.label}</span>
          </Button>
        ))}
      </fieldset>

        {/* Com a folha aberta é ela que credita a fonte: repetir aqui
            deixaria dois links iguais na mesma tela, e o de baixo coberto. */}
        {!answer && <Source href={piece.sourceUrl} />}
      </Card>

      {answer && (
        <OutcomeSheet
          answer={answer}
          choice={chosen}
          onContinue={() => onContinue?.()}
        />
      )}
    </div>
  );
}

/** Anexo V 5.V: a orientação precisa dizer de onde veio. */
export function Source({ href }: { href: string }) {
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
