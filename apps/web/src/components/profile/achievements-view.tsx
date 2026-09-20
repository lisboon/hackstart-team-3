"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/hooks/profile/use-profile";
import { MilestoneCard } from "@/components/profile/milestone-card";
import { milestones } from "@/components/profile/achievements-presentation";

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
