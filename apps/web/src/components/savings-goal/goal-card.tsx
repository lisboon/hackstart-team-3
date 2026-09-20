"use client";

import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { Goal } from "@/schemas/savings-goal";
import { GoalEndOfTerm } from "./goal-end-of-term";

/**
 * O cartão "Colheita" de uma meta. Sem cifra: o anel conta meses, não reais.
 *
 * - MONTHLY: a meta do mês, cheia quando o mês corrente fechou no azul.
 * - ENDURING: "X de N meses", com a meta mensal do mês decomposta em texto.
 *
 * No fim do prazo sem cumprir, o cartão dá lugar ao acolhimento (estender ou
 * encerrar), sem vermelho e sem "você falhou".
 */
export function GoalCard({
  goal,
  pending,
  onExtend,
  onEnd,
}: {
  goal: Goal;
  pending: boolean;
  onExtend: (id: string, targetMonths: number) => void;
  onEnd: (id: string, reason?: import("@/schemas/savings-goal").SavingsGoalUnmetReason) => void;
}) {
  if (goal.termEndedUnmet) {
    return (
      <GoalEndOfTerm
        goal={goal}
        pending={pending}
        onExtend={onExtend}
        onEnd={onEnd}
      />
    );
  }

  const isEnduring = goal.kind === "ENDURING";
  const ratio = goal.targetMonths > 0 ? goal.monthsMet / goal.targetMonths : 0;
  const met = goal.status === "MET";

  const ringLabel = isEnduring
    ? `Meta duradoura: ${goal.monthsMet} de ${goal.targetMonths} meses guardados`
    : goal.currentMonthMet
      ? "Meta do mês cumprida"
      : "Meta do mês em andamento";

  return (
    <Card aria-label="Meta de guarda">
      <div className="flex items-center gap-4">
        <ProgressRing ratio={met ? 1 : ratio} size={84} stroke={8} label={ringLabel}>
          <span className="text-lg" aria-hidden>
            {met || goal.currentMonthMet ? "🌱" : "🌾"}
          </span>
        </ProgressRing>
        <div className="grid gap-1">
          <h2 className="text-base font-semibold">
            {isEnduring ? "Sua colheita" : "Sua colheita do mês"}
          </h2>
          {isEnduring ? (
            <>
              <p className="text-sm text-muted-foreground">
                {goal.monthsMet} de {goal.targetMonths} meses guardados
              </p>
              <p className="text-xs text-muted-foreground">
                {goal.currentMonthMet
                  ? "Este mês já conta. Continue regando."
                  : "A meta do mês é guardar algo — mesmo que pouco."}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {met
                ? "Você guardou algo este mês. Isso é a colheita."
                : "A meta é guardar algo este mês — o valor importa menos que o hábito."}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
