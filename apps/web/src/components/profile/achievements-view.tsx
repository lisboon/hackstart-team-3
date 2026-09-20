"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/hooks/profile/use-profile";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import {
  milestones,
  type Milestone,
} from "@/components/profile/achievements-presentation";

/**
 * Conquistas: grade de marcos derivados. Trajetória em âmbar, trilha em verde.
 * Os não conquistados ficam apagados, mas visíveis — saber o que vem depois é
 * metade do valor. Sem moeda, sem ranking, sem comparação com outras pessoas.
 */
export function AchievementsView({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { data, error, loading, reload } = useProfile(token, onUnauthorized);
  const items = data ? milestones(data.summary, data.track) : [];

  return (
    <Card className="gap-6">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">Suas conquistas</p>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Marcos
        </h1>
        <p className="text-sm text-muted-foreground">
          Marcos calculados do seu próprio caminho. Os que ainda não vieram
          aparecem apagados, para você ver o que está por perto.
        </p>
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {loading ? "Carregando suas conquistas…" : ""}
      </p>

      {error && !data && (
        <>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:justify-self-start"
            onClick={() => void reload()}
          >
            Tentar de novo
          </Button>
        </>
      )}

      {data && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </ul>
      )}
    </Card>
  );
}

const KIND_ACCENT: Readonly<Record<Milestone["kind"], string>> = {
  // Âmbar para trajetória, verde (primary) para trilha. A cor é reforço; o
  // estado vem também do texto e da opacidade, nunca só da cor (WCAG 1.4.1).
  trajectory: "var(--achievement-trajectory)",
  track: "var(--primary)",
};

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const status = milestone.achieved ? "Conquistado" : "A caminho";
  // Marco de trilha nomeia a etapa do COOPS; o de trajetória já traz o rótulo.
  const title = milestone.stage
    ? `Etapa ${STAGE_LABEL[milestone.stage]}`
    : milestone.label;
  return (
    <li
      className={
        milestone.achieved
          ? "grid gap-1 rounded-xl border border-border bg-muted p-4"
          : "grid gap-1 rounded-xl border border-border p-4 opacity-60"
      }
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: milestone.achieved
              ? KIND_ACCENT[milestone.kind]
              : "var(--muted-foreground)",
          }}
        />
        <p className="min-w-0 font-semibold">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{milestone.description}</p>
      {/* Estado em texto, além da cor e da opacidade. */}
      <p className="text-xs font-medium text-muted-foreground">{status}</p>
    </li>
  );
}
