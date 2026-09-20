"use client";

import { Check, Droplets, Lock } from "lucide-react";
import { ICON_STROKE } from "@/components/ui/icon";
import { StageBanner } from "@/components/journey/stage-banner";
import {
  POINTS_PER_PIECE,
  coopsSections,
  type StageSection,
} from "@/components/journey/coops-sections";
import { trailGeometry } from "@/components/journey/trail-geometry";
import type { JourneyNode } from "@/schemas/wellbeing";

/**
 * O mapa da trilha: um caminho sinuoso estilo Duolingo, quebrado pelas cinco
 * etapas do método COOPS.
 *
 * Cada etapa é uma seção com a sua faixa grudenta e a sua própria serpentina,
 * reiniciando no centro — é assim que o caminho lê como unidade nova em vez de
 * uma fita sem fim. `trailGeometry` calcula a posição de cada nó e a curva que
 * os liga, para qualquer quantidade de peças.
 *
 * Nada aqui usa cor literal: o mapa vive nos tokens do tema. Com cor crua, em
 * modo escuro ele voltava a ser um retângulo branco luminoso sobre a página.
 */
export function JourneyMap({
  nodes,
  onOpen,
}: {
  nodes: JourneyNode[];
  onOpen: (node: JourneyNode) => void;
}) {
  const sections = coopsSections(nodes);

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <StageTrail key={section.stage} section={section} onOpen={onOpen} />
      ))}
    </div>
  );
}

function StageTrail({
  section,
  onOpen,
}: {
  section: StageSection;
  onOpen: (node: JourneyNode) => void;
}) {
  const geometry = trailGeometry(section.nodes.length);

  return (
    <section className="space-y-1">
      <StageBanner section={section} />

      {/*
        O palco tem a proporção travada no mesmo valor do `viewBox`, e é isso
        que faz `preserveAspectRatio="none"` não distorcer: com a razão igual, o
        fator de escala é o mesmo nos dois eixos.

        Os dois andam juntos e não se mexe num sem o outro — os nós são
        posicionados em porcentagem **do contêiner**, não do SVG. Com `meet` o
        caminho ganharia tarja e os nós escorregariam para fora da curva.

        Pelo mesmo motivo, nada de `min-h-*` nem `flex-1` aqui: qualquer coisa
        que estique a caixa sobrepõe o `aspect-ratio` e dessincroniza os dois.
      */}
      <div
        className="relative w-full select-none"
        style={{ aspectRatio: `${geometry.width} / ${geometry.height}` }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-70"
          fill="none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        >
          <path
            d={geometry.path}
            stroke="var(--border)"
            strokeDasharray="2 10"
            strokeLinecap="round"
            strokeWidth="7"
          />
        </svg>

        {section.nodes.map((node, index) => {
          const point = geometry.points[index];
          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(point.x / geometry.width) * 100}%`,
                top: `${(point.y / geometry.height) * 100}%`,
              }}
            >
              <TrailNode node={node} onOpen={onOpen} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

const STATE_LABEL = {
  answered: "Concluída",
  current: "Peça de hoje",
  locked: "Ainda trancada",
} as const;

function TrailNode({
  node,
  onOpen,
}: {
  node: JourneyNode;
  onOpen: (node: JourneyNode) => void;
}) {
  const locked = node.state === "locked";

  return (
    // `relative` é o que ancora a chamada no nó. Sem ele ela se pendurava no
    // contêiner absoluto de fora e flutuava no lugar errado.
    <div
      className={`relative flex flex-col items-center ${locked ? "opacity-70" : ""}`}
    >
      {node.state === "current" && (
        <div className="animate-bounce-gentle absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-brand bg-card px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary shadow-lg">
          <span>COMEÇAR</span>
          <span className="font-extrabold text-achievement-trajectory">
            +{POINTS_PER_PIECE} pontos
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={locked}
        aria-disabled={locked}
        aria-label={`${node.title} — ${STATE_LABEL[node.state]}`}
        onClick={() => onOpen(node)}
        className={nodeButtonClass(node.state)}
      >
        <NodeGlyph state={node.state} />
      </button>
    </div>
  );
}

/**
 * O relevo tátil do Duolingo: uma sombra sólida embaixo, que some quando o
 * botão afunda. `color-mix` escurece o próprio token, então o relevo acompanha
 * o tema em vez de fixar um verde que só existe no claro.
 */
function nodeButtonClass(state: JourneyNode["state"]): string {
  const base =
    "flex items-center justify-center rounded-full border-4 transition-all active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  if (state === "answered") {
    // O verde da marca aqui é preenchimento e contorno, nunca letra — é
    // exatamente o uso que o manual permite a ele (docs/identidade.html).
    return `${base} size-16 border-brand bg-brand shadow-[0_6px_0_color-mix(in_srgb,var(--brand)_65%,black)]`;
  }
  if (state === "current") {
    return `${base} size-[72px] border-primary bg-primary shadow-[0_6px_0_color-mix(in_srgb,var(--primary)_60%,black)] ring-4 ring-brand/35`;
  }
  return `${base} size-16 cursor-not-allowed border-border bg-muted shadow-[0_5px_0_var(--border)]`;
}

/**
 * Ícone em vez de emoji: emoji não herda a cor do tema, e cada sistema desenha
 * o seu — em modo escuro alguns somem.
 */
function NodeGlyph({ state }: { state: JourneyNode["state"] }) {
  if (state === "answered") {
    return (
      <Check
        aria-hidden
        className="size-7 text-primary-foreground"
        strokeWidth={3}
      />
    );
  }
  if (state === "current") {
    return (
      <Droplets
        aria-hidden
        className="size-8 text-primary-foreground"
        strokeWidth={ICON_STROKE}
      />
    );
  }
  return (
    <Lock
      aria-hidden
      className="size-6 text-muted-foreground"
      strokeWidth={ICON_STROKE}
    />
  );
}
