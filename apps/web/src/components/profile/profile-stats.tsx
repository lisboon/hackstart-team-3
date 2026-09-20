import { StatTile } from "@/components/ui/stat-tile";
import type { ProfileStat } from "@/components/profile/profile-presentation";

/**
 * Os números da pessoa, dois por linha. É uma lista de definição de verdade
 * (`dl`), e não uma grade de divs, porque cada bloco é um par rótulo/valor — um
 * leitor de tela anuncia "Meses declarados, 4" em vez de dois textos soltos.
 *
 * O título da seção fica visível: "sua história" é o que diferencia estes
 * números de um painel de métricas.
 */
export function ProfileStats({ stats }: { stats: ProfileStat[] }) {
  return (
    <section aria-labelledby="profile-stats-heading" className="grid gap-3">
      <h2
        id="profile-stats-heading"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Sua história
      </h2>
      <dl className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <StatTile
            key={stat.id}
            label={stat.label}
            value={
              <span
                className={
                  stat.emphasis === "number" ? undefined : "text-sm leading-tight"
                }
              >
                {stat.value}
              </span>
            }
          />
        ))}
      </dl>
    </section>
  );
}
