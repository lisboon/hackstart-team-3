"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Goal, SavingsGoalUnmetReason } from "@/schemas/savings-goal";
import { UNMET_REASONS } from "./savings-goal-presentation";

/**
 * Fim de prazo sem cumprir. Acolhe: sem vermelho, sem "você falhou". Espelha a
 * peça do COOPS — o que já foi guardado continua valendo. Oferece estender ou
 * encerrar, e um motivo OPCIONAL em opções fechadas (nunca texto livre).
 */
export function GoalEndOfTerm({
  goal,
  pending,
  onExtend,
  onEnd,
}: {
  goal: Goal;
  pending: boolean;
  onExtend: (id: string, targetMonths: number) => void;
  onEnd: (id: string, reason?: SavingsGoalUnmetReason) => void;
}) {
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState<SavingsGoalUnmetReason | null>(null);

  return (
    <Card aria-label="Fim do prazo da meta">
      <h2 className="text-base font-semibold">Seu prazo chegou ao fim</h2>
      <p className="text-sm text-muted-foreground">
        Você guardou em {goal.monthsMet} de {goal.targetMonths} meses. O que já
        foi guardado continua sendo seu — nada disso se perde. Daqui você escolhe
        como seguir.
      </p>

      {!ending ? (
        <div className="grid gap-2 sm:flex">
          <Button
            type="button"
            disabled={pending}
            onClick={() => onExtend(goal.id, goal.targetMonths + 3)}
          >
            Dar mais três meses
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setEnding(true)}
          >
            Encerrar esta meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm">
            Se quiser, diga o que pesou — é opcional e só você vê.
          </p>
          <div
            role="group"
            aria-label="Motivo (opcional)"
            className="grid gap-2"
          >
            {UNMET_REASONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={reason === option.value}
                onClick={() =>
                  setReason((current) =>
                    current === option.value ? null : option.value,
                  )
                }
                className={cn(
                  "rounded-xl border p-3 text-left text-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  reason === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:flex">
            <Button
              type="button"
              disabled={pending}
              onClick={() => onEnd(goal.id, reason ?? undefined)}
            >
              Encerrar
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setEnding(false);
                setReason(null);
              }}
            >
              Voltar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
