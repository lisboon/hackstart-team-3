"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_MOOD_NOTE_LENGTH, type MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS, moodLabel } from "./mood-presentation";
import { WEATHER_ICON } from "./mood-weather-icons";

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
    <Card aria-labelledby={id} className="gap-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        Como você está se sentindo hoje?
      </h2>
      <p className="text-sm text-muted-foreground">
        Um toque abre a confirmação. Ninguém além de você vê esta resposta.
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => {
          const Weather = WEATHER_ICON[level.value];
          return (
            <button
              key={level.value}
              ref={(node) => {
                triggers.current.set(level.value, node);
              }}
              type="button"
              aria-label={level.label}
              disabled={pending}
              aria-haspopup="dialog"
              onClick={() => setChoice(level.value)}
              className={cn(
                "grid aspect-square place-items-center rounded-2xl border p-2 transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "disabled:pointer-events-none",
                choice === level.value
                  ? "border-2 border-primary bg-primary/5 text-primary ring-2 ring-primary/10"
                  : "border-border text-muted-foreground hover:border-foreground/30 disabled:opacity-50",
              )}
            >
              <Weather className="h-6 w-6" />
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {choice !== null && (
        <Sheet id={`${id}-confirm`} title="Confirmar como você está" onClose={close}>
          <p className="text-sm">
            Oi! Que bom que você compartilhou que está{" "}
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
