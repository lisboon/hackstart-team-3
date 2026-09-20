"use client";

import { useId } from "react";
import { Card } from "@/components/ui/card";
import type { MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS } from "./mood-presentation";
import { WEATHER_ICON } from "./mood-weather-icons";

/**
 * O humor do dia já registrado, fixo no topo da Home. É só leitura: a resposta
 * é uma por dia, sem correção (o backend recusa uma segunda), então aqui a
 * pessoa vê o tempo que marcou, sem poder trocar. O estado vem por ícone +
 * palavra, não só por cor — o mesmo ícone de clima da pesquisa.
 */
export function MoodBadge({ mood }: { mood: MoodScale }) {
  const id = useId();
  const level = MOOD_LEVELS.find((entry) => entry.value === mood);
  if (!level) return null;
  const Weather = WEATHER_ICON[level.value];

  return (
    <Card aria-labelledby={id} className="gap-2 rounded-b-none rounded-t-2xl">
      <h2 id={id} className="text-sm font-semibold text-muted-foreground">
        Como você está hoje
      </h2>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-2xl border border-primary bg-primary/5 text-primary"
        >
          <Weather className="h-6 w-6" />
        </span>
        <div className="grid gap-0.5">
          <span className="text-base font-semibold">{level.label}</span>
          <span className="text-xs text-muted-foreground">
            Registrado. Amanhã tem outro dia.
          </span>
        </div>
      </div>
    </Card>
  );
}
