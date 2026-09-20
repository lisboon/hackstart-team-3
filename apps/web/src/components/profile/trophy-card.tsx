import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import { trophySrc } from "@/components/profile/achievements-presentation";
import type { Milestone } from "@/components/profile/achievements-presentation";

/**
 * Um troféu na vitrine de Conquistas. Imagem colorida quando conquistado, em
 * tom sépia quando ainda não — o estado visual é o filtro, sem etiqueta de
 * texto na tela.
 *
 * A a11y não depende da cor: o estado vai no `alt` da imagem ("conquistado" /
 * "ainda não conquistado"), então leitor de tela sabe o que a sépia diz (WCAG
 * 1.4.1). O rótulo curto embaixo nomeia o marco.
 */
export function TrophyCard({ milestone }: { milestone: Milestone }) {
  const title = milestone.stage
    ? STAGE_LABEL[milestone.stage]
    : milestone.label;
  const state = milestone.achieved ? "conquistado" : "ainda não conquistado";

  return (
    <li className="grid justify-items-center gap-1.5 text-center">
      {/* SVG local e pequeno: next/image não agrega aqui e exigiria dimensões
          de layout que a vitrine não precisa. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={trophySrc(milestone)}
        alt={`Troféu ${title} — ${state}`}
        width={64}
        height={64}
        className={
          milestone.achieved
            ? "size-16"
            : "size-16 opacity-60 [filter:grayscale(1)_sepia(0.6)]"
        }
      />
      <span className="text-xs font-medium leading-tight text-muted-foreground">
        {title}
      </span>
    </li>
  );
}
