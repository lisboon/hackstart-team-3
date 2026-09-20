"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SavingsGoalKind } from "@/schemas/savings-goal";
import { GOAL_KIND_LABEL } from "./savings-goal-presentation";

const ENDURING_MONTHS = [3, 6, 12] as const;

/**
 * Criação da meta: a pessoa escolhe o horizonte. MONTHLY não pede mais nada;
 * ENDURING pede por quantos meses. Sem cifra — nenhum campo de valor.
 */
export function GoalCreation({
  pending,
  onCreate,
}: {
  pending: boolean;
  onCreate: (kind: SavingsGoalKind, targetMonths?: number) => void;
}) {
  const [kind, setKind] = useState<SavingsGoalKind | null>(null);
  const [months, setMonths] = useState<number>(6);

  return (
    <Card aria-label="Nova meta de guarda">
      <h2 className="text-base font-semibold">Criar uma meta de guarda</h2>
      <p className="text-sm text-muted-foreground">
        A meta é sobre o hábito de guardar, não sobre quanto. Escolha o
        horizonte.
      </p>

      <div role="group" aria-label="Tipo de meta" className="grid gap-2">
        {(Object.keys(GOAL_KIND_LABEL) as SavingsGoalKind[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={cn(
              "rounded-xl border p-3 text-left text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              kind === option
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted",
            )}
          >
            {GOAL_KIND_LABEL[option]}
          </button>
        ))}
      </div>

      {kind === "ENDURING" && (
        <div role="group" aria-label="Por quantos meses" className="grid gap-2">
          <p className="text-sm">Por quantos meses?</p>
          <div className="flex gap-2">
            {ENDURING_MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={months === m}
                onClick={() => setMonths(m)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  months === m
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                {m} meses
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        disabled={pending || !kind}
        className="w-full sm:w-auto sm:justify-self-start"
        onClick={() =>
          kind &&
          onCreate(kind, kind === "ENDURING" ? months : undefined)
        }
      >
        Criar meta
      </Button>
    </Card>
  );
}
