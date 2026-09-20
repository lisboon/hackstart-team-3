"use client";

import { Card } from "@/components/ui/card";
import { useGoals } from "@/hooks/savings-goal/use-goals";
import { GoalCard } from "./goal-card";
import { GoalCreation } from "./goal-creation";

/**
 * A seção de metas de guarda na tela Progresso. Lista as metas ativas e
 * cumpridas (as encerradas saem da vista) e sempre oferece criar uma nova —
 * várias metas ativas convivem (uma mensal e uma duradoura, por exemplo).
 */
export function GoalsWorkspace({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { goals, error, loading, pending, create, extend, end } = useGoals(
    token,
    onUnauthorized,
  );

  const visible =
    goals?.goals.filter((goal) => goal.status !== "ENDED") ?? [];

  return (
    <section className="grid gap-4" aria-label="Metas de guarda">
      <h2 className="text-lg font-semibold">Suas metas de guarda</h2>

      {loading && !goals && (
        <Card>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            Carregando suas metas…
          </p>
        </Card>
      )}

      {error && (
        <Card>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        </Card>
      )}

      {goals && visible.length === 0 && (
        <Card>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem uma meta. Uma meta é o objetivo por trás da
            colheita — você define quanto quer guardar e em quanto tempo.
          </p>
        </Card>
      )}

      {visible.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          pending={pending}
          onExtend={extend}
          onEnd={end}
        />
      ))}

      <GoalCreation pending={pending} onCreate={create} />
    </section>
  );
}
