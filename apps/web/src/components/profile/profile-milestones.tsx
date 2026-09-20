import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/components/ui/icon";
import { MilestoneCard } from "@/components/profile/milestone-card";
import type { Milestone } from "@/components/profile/achievements-presentation";

/** Quantos marcos cabem no perfil antes de virar a tela de Conquistas. */
const PREVIEW = 3;

/**
 * Prévia dos marcos. Mostra os conquistados primeiro — o perfil abre com o que a
 * pessoa já tem, não com o que falta — e completa a lista com o que está mais
 * perto de vir, pela barra de progresso.
 *
 * Reaproveita os mesmos marcos e o mesmo cartão da tela de Conquistas em vez de
 * recalcular e redesenhar: um segundo cálculo divergiria no dia em que um limiar
 * mudasse.
 */
export function ProfileMilestones({ milestones }: { milestones: Milestone[] }) {
  const achieved = milestones.filter((milestone) => milestone.achieved);
  const closest = milestones
    .filter((milestone) => !milestone.achieved)
    .sort((a, b) => b.progress - a.progress);
  const preview = [...achieved, ...closest].slice(0, PREVIEW);

  return (
    <Card className="gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Conquistas da Colheita</h2>
        <Link
          href="/conquistas"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg text-xs font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ver todas ({milestones.length})
          <ChevronRight
            aria-hidden
            className="size-3.5"
            strokeWidth={ICON_STROKE}
          />
        </Link>
      </header>
      <ul className="grid gap-3">
        {preview.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </ul>
    </Card>
  );
}
