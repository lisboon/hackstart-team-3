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
  return (
    <li
      className={
        milestone.achieved
          ? "grid gap-2 rounded-xl border border-border bg-muted p-4"
          : "grid gap-2 rounded-xl border border-border p-4 opacity-60"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: milestone.achieved
                  ? KIND_ACCENT[milestone.kind]
                  : "var(--muted-foreground)",
              }}
            />
            <p className="min-w-0 text-sm font-semibold">{title}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {milestone.description}
          </p>
        </div>
        <Badge variant={milestone.achieved ? "achieved" : "pending"}>
          {milestone.achieved ? "Conquistado" : "A caminho"}
        </Badge>
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
