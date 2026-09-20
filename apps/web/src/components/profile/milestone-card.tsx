import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { Milestone } from "@/components/profile/achievements-presentation";

/**
 * Um marco, desenhado igual no perfil e na tela de Conquistas. Havia dois
 * desenhos para o mesmo dado — um com ponto colorido, outro com etiqueta — e
 * dois desenhos do mesmo objeto acabam divergindo na primeira mudança.
 *
 * O não conquistado fica apagado mas presente: saber o que vem depois é metade
 * do valor, e um cadeado escondido não informa nada. Junto vem a barra do quanto
 * já foi andado, porque "falta pouco" é informação e "não veio" não é.
 *
 * O estado aparece em três canais — opacidade, cor do ponto e texto da etiqueta.
 * Cor sozinha não indica estado (WCAG 1.4.1).
 */
const KIND_ACCENT: Readonly<Record<Milestone["kind"], string>> = {
  // Âmbar para trajetória, o de prestígio; verde para trilha.
  trajectory: "var(--achievement-trajectory)",
  track: "var(--primary)",
};

export function MilestoneCard({ milestone }: { milestone: Milestone }) {
  // O marco de trilha nomeia a etapa do COOPS; o de trajetória já traz rótulo.
  const title = milestone.stage
    ? `Etapa ${STAGE_LABEL[milestone.stage]}`
    : milestone.label;
  const accent = milestone.achieved
    ? KIND_ACCENT[milestone.kind]
    : "var(--muted-foreground)";
  return (
    <li
      className={
        milestone.achieved
          ? "grid gap-3 rounded-2xl border bg-muted p-4 shadow-sm transition-colors"
          : "grid gap-3 rounded-2xl border border-dashed border-border p-4 opacity-70 transition-colors"
      }
      style={
        milestone.achieved
          ? { borderColor: `color-mix(in srgb, ${accent} 45%, var(--border))` }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {/* Medalhão: cheio no conquistado, contorno no que falta. O ícone (✓/○)
            é o terceiro canal de estado, além de cor e opacidade (WCAG 1.4.1). */}
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold"
          style={
            milestone.achieved
              ? { backgroundColor: accent, color: "var(--primary-foreground)" }
              : {
                  border: `1.5px dashed ${accent}`,
                  color: "var(--muted-foreground)",
                }
          }
        >
          {milestone.achieved ? "✓" : "○"}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <p className="min-w-0 break-words text-sm font-semibold">{title}</p>
            <Badge
              variant={milestone.achieved ? "achieved" : "pending"}
              className="shrink-0"
            >
              {milestone.achieved ? "Conquistado" : "A caminho"}
            </Badge>
          </div>
          <p className="break-words text-xs text-muted-foreground">
            {milestone.description}
          </p>
        </div>
      </div>
      {!milestone.achieved && milestone.progress > 0 && (
        <ProgressBar
          ratio={milestone.progress}
          label={`${title}: caminho já andado`}
        />
      )}
    </li>
  );
}
