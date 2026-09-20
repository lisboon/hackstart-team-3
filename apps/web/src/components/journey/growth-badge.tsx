import { ProgressRing } from "@/components/ui/progress-ring";
import { growthProgress } from "@/components/journey/growth-stage";

/**
 * O estágio de crescimento da pessoa, no topo da trilha.
 *
 * Mostra onde ela está — semente, broto, muda, planta, fruto — e o quanto
 * falta para o próximo, **contra o próprio passado**. Nenhuma outra pessoa
 * aparece aqui, nem por número nem por posição.
 *
 * O anel é o mesmo `ProgressRing` do perfil: a identidade do produto é uma
 * forma só, usada em escalas diferentes.
 */
export function GrowthBadge({ points }: { points: number }) {
  const { stage, next, toNext, ratio } = growthProgress(points);

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <ProgressRing
        ratio={ratio}
        size={56}
        stroke={6}
        label={
          next
            ? `${stage.label}: faltam ${toNext} pontos para ${next.label}`
            : `${stage.label}, o último estágio da trilha`
        }
      >
        <span className="text-lg" aria-hidden>
          {STAGE_GLYPH[stage.key]}
        </span>
      </ProgressRing>

      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{stage.label}</p>
        <p className="text-xs leading-snug text-muted-foreground">
          {stage.caption}
        </p>
        {next && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-achievement-trajectory">
              {toNext}
            </span>{" "}
            {toNext === 1 ? "ponto" : "pontos"} para {next.label}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * O símbolo é enfeite e leva `aria-hidden`: quem usa leitor de tela recebe o
 * estágio pelo rótulo do anel e pelo nome ao lado, nunca pelo desenho.
 */
const STAGE_GLYPH = {
  semente: "🌰",
  broto: "🌱",
  muda: "🪴",
  planta: "🌿",
  fruto: "🍎",
} as const;
