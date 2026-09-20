"use client";

import { useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS, moodLabel } from "./mood-presentation";

/**
 * Botão, não rádio: num grupo de rádios a seta do teclado troca a seleção, e
 * aqui selecionar já registra o dia. Navegar pela escala não pode registrar.
 *
 * A resposta é uma por dia e não se corrige, então a tela só existe enquanto o
 * dia está sem resposta. O toque é confirmado em texto porque cor sozinha não
 * comunica estado para quem não distingue o verde.
 */
export function MoodPrompt({
  pending,
  error,
  onSelect,
}: {
  pending: boolean;
  error: string;
  onSelect: (mood: MoodScale) => void;
}) {
  const id = useId();
  const [tapped, setTapped] = useState<MoodScale | null>(null);

  function choose(mood: MoodScale) {
    setTapped(mood);
    onSelect(mood);
  }

  return (
    <Card aria-labelledby={id} className="min-h-[60vh] place-content-center">
      <h1 id={id} className="text-xl font-semibold tracking-tight md:text-2xl">
        Como está o seu tempo hoje?
      </h1>
      <p className="text-sm text-muted-foreground">
        Um toque é suficiente. Ninguém além de você vê esta resposta.
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            disabled={pending}
            onClick={() => choose(level.value)}
            className={cn(
              "grid min-h-18 justify-items-center gap-1 rounded-xl border p-2 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "disabled:pointer-events-none",
              tapped === level.value
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
      <p role="status" aria-live="polite" className="text-sm">
        {pending && tapped ? `Registrando: ${moodLabel(tapped)}` : ""}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </Card>
  );
}
