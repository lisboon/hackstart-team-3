"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_MOOD_NOTE_LENGTH, type MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS, moodLabel } from "./mood-presentation";

/**
 * Botão, não rádio: num grupo de rádios a seta do teclado troca a seleção. Aqui
 * o toque não registra mais o dia direto (#91): ele abre um popup de
 * confirmação, onde a pessoa pode especificar em texto livre o que está
 * sentindo — ou seguir sem dizer. Registrar é sempre uma escolha explícita, e
 * fechar o popup não grava nada.
 *
 * A resposta é uma por dia e não se corrige, então a tela só existe enquanto o
 * dia está sem resposta. O toque é confirmado em texto porque cor sozinha não
 * comunica estado para quem não distingue o verde.
 */
export function MoodPrompt({
  pending,
  error,
  onConfirm,
}: {
  pending: boolean;
  error: string;
  onConfirm: (mood: MoodScale, note?: string) => void;
}) {
  const id = useId();
  const noteId = useId();
  // O humor escolhido fica pendente de confirmação até a pessoa registrar ou
  // desistir: enquanto isso, o popup está aberto sobre ele.
  const [choice, setChoice] = useState<MoodScale | null>(null);
  const [note, setNote] = useState("");
  const triggers = useRef(new Map<MoodScale, HTMLButtonElement | null>());

  function close() {
    const focusBack = choice;
    setChoice(null);
    setNote("");
    if (focusBack !== null) triggers.current.get(focusBack)?.focus();
  }

  function confirm(withNote: boolean) {
    if (choice === null) return;
    onConfirm(choice, withNote ? note : undefined);
    // Não devolve o foco: a confirmação recarrega o dia e a pergunta sai da
    // tela. Só limpamos o estado local.
    setChoice(null);
    setNote("");
  }

  return (
    <Card aria-labelledby={id} className="min-h-[60vh] place-content-center">
      <h1 id={id} className="text-xl font-semibold tracking-tight md:text-2xl">
        Como está o seu tempo hoje?
      </h1>
      <p className="text-sm text-muted-foreground">
        Um toque abre a confirmação. Ninguém além de você vê esta resposta.
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level.value}
            ref={(node) => {
              triggers.current.set(level.value, node);
            }}
            type="button"
            disabled={pending}
            aria-haspopup="dialog"
            onClick={() => setChoice(level.value)}
            className={cn(
              "grid min-h-18 justify-items-center gap-1 rounded-xl border p-2 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "disabled:pointer-events-none",
              choice === level.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted disabled:opacity-50",
            )}
          >
            <span aria-hidden className="text-2xl leading-none">
              {level.emoji}
            </span>
            <span className="text-center text-xs leading-tight">
              {level.label}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {choice !== null && (
        <Sheet id={`${id}-confirm`} title="Confirmar o seu tempo" onClose={close}>
          <p className="text-sm">
            Oi! Que bom que você compartilhou que o seu tempo hoje está{" "}
            <strong>{moodLabel(choice).toLowerCase()}</strong>. Quer especificar
            mais o que está sentindo?
          </p>
          <label htmlFor={noteId} className="text-sm font-medium">
            Se quiser, conte um pouco (opcional)
          </label>
          <Textarea
            id={noteId}
            value={note}
            maxLength={MAX_MOOD_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            placeholder="O que está pesando ou animando hoje…"
          />
          <p aria-live="polite" className="text-xs text-muted-foreground">
            É só seu. Nunca aparece para o gestor.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() => confirm(true)}
            >
              Registrar
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => confirm(false)}
            >
              Não responder
            </Button>
          </div>
          <p role="status" aria-live="polite" className="text-sm">
            {pending ? `Registrando: ${moodLabel(choice)}` : ""}
          </p>
        </Sheet>
      )}
    </Card>
  );
}
