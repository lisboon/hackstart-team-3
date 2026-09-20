"use client";

import { useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS, moodLabel } from "./mood-presentation";
import { WEATHER_ICON } from "./mood-weather-icons";

/**
 * A pergunta de humor, integrada no topo da Home. Dois modos:
 *
 * - **sem `answered`**: interativo. Botão, não rádio — num grupo de rádios a
 *   seta do teclado trocaria a seleção, e aqui um toque já registra o dia.
 * - **com `answered`**: o dia já foi respondido. A opção escolhida fica marcada
 *   e tudo desabilitado: uma resposta por dia, sem correção (o backend recusa a
 *   segunda). Mostra o que foi marcado, sem deixar trocar.
 *
 * O texto saiu dos botões (só o ícone do tempo). Como a cor sozinha não indica
 * estado (WCAG 1.4.1), o rótulo vai no `aria-label` de cada botão, e o estado
 * marcado usa `aria-pressed` — o leitor de tela continua sabendo o que é o quê.
 */
export function MoodPrompt({
  pending,
  error,
  onSelect,
  answered = null,
}: {
  pending: boolean;
  error: string;
  onSelect: (mood: MoodScale) => void;
  answered?: MoodScale | null;
}) {
  const id = useId();
  const [tapped, setTapped] = useState<MoodScale | null>(null);
  const done = answered !== null;
  const marked = answered ?? tapped;

  function choose(mood: MoodScale) {
    if (done) return;
    setTapped(mood);
    onSelect(mood);
  }

  return (
    <Card aria-labelledby={id} className="gap-3 rounded-b-none">
      <h2 id={id} className="text-base font-semibold">
        {done ? "Seu tempo hoje" : "Como está o seu tempo hoje?"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {done
          ? "Registrado. Amanhã tem outro dia."
          : "Um toque é suficiente. Ninguém além de você vê esta resposta."}
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => {
          const Weather = WEATHER_ICON[level.value];
          const selected = marked === level.value;
          return (
            <button
              key={level.value}
              type="button"
              aria-label={level.label}
              aria-pressed={selected}
              disabled={pending || done}
              onClick={() => choose(level.value)}
              className={cn(
                "grid min-h-14 place-items-center rounded-2xl border p-2 transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "disabled:pointer-events-none",
                selected
                  ? "border-2 border-primary bg-primary/5 text-primary ring-2 ring-primary/10"
                  : cn(
                      "border-border text-muted-foreground",
                      done ? "opacity-40" : "hover:border-foreground/30",
                    ),
              )}
            >
              <Weather />
            </button>
          );
        })}
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
