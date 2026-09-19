"use client";

import { useId } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MOOD_LEVELS, moodLabel, type MoodLevel } from "./mood-presentation";

/**
 * Botão, não rádio: num grupo de rádios a seta do teclado troca a seleção, e
 * aqui selecionar já é registrar. Navegar pela escala não pode registrar humor.
 *
 * A escolha é confirmada também em texto, porque cor sozinha não comunica
 * estado para quem não distingue o verde.
 */
export function MoodPrompt({
  selected,
  onSelect,
}: {
  selected: MoodLevel | null;
  onSelect: (mood: MoodLevel) => void;
}) {
  const id = useId();
  return (
    <Card aria-labelledby={id}>
      <h1 id={id} className="text-xl font-semibold tracking-tight md:text-2xl">
        Como você está hoje?
      </h1>
      <p className="text-sm text-muted-foreground">
        Um toque é suficiente. Nada além disso é perguntado.
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            aria-pressed={selected === level.value}
            onClick={() => onSelect(level.value)}
            className={cn(
              "grid min-h-18 justify-items-center gap-1 rounded-xl border p-2 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected === level.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
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
        {selected ? `Hoje: ${moodLabel(selected)}` : ""}
      </p>
    </Card>
  );
}
