"use client";

import { trailGeometry } from "@/components/journey/trail-geometry";
import type { JourneyNode } from "@/schemas/wellbeing";

/**
 * O mapa da trilha, no visual de `home.html` (mapa sinuoso estilo Duolingo):
 * caminho tracejado em curva, nós grandes com relevo tátil e decoração
 * botânica ao redor.
 *
 * O caminho não é mais hard-coded: `trailGeometry` calcula a posição de cada
 * nó (x em senoide, y linear) e desenha a curva que os liga, para qualquer
 * número de peças. Um nó por peça, vindo de `GET /me/journey`; o estado decide
 * o desenho e o que o toque faz.
 *
 * DECISÃO DE ESCOPO (aprovada): estrelas, baú e o selo "+15 XP" são ENFEITE
 * VISUAL ESTÁTICO — placeholder para a implementação futura (issue #60). Sem
 * dado, sem cálculo, sem persistência.
 */
export function JourneyMap({
  nodes,
  onOpen,
}: {
  nodes: JourneyNode[];
  onOpen: (node: JourneyNode) => void;
}) {
  const geometry = trailGeometry(nodes.length);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-[#f9fbf9] to-white p-4 shadow-sm">
      {/* Banner do módulo, como no home.html */}
      <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-emerald-600 p-3.5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-6 -bottom-8 size-24 rounded-full bg-emerald-500 opacity-40 blur-lg" />
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
            Sua trilha
          </span>
          <h3 className="text-base font-bold leading-snug">Preparando a Terra</h3>
          <p className="text-[11px] font-medium text-emerald-100">
            Método COOPS · Cooperação na Ponta do Lápis
          </p>
        </div>
      </div>

      {/* O palco do mapa tem a proporção do viewBox gerado: assim os nós,
          posicionados em porcentagem, caem exatamente sobre a curva. */}
      <div
        className="relative mt-2 w-full select-none"
        style={{ aspectRatio: `${geometry.width} / ${geometry.height}` }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        >
          <path
            d={geometry.path}
            stroke="#d7dfd7"
            strokeDasharray="2 10"
            strokeLinecap="round"
            strokeWidth="7"
          />
        </svg>

        {nodes.map((node, index) => {
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
  const stateLabel = STATE_LABEL[node.state];

  return (
    <div
      className={`flex flex-col items-center ${locked ? "opacity-60" : ""}`}
    >
      {/* Chamada de ação do nó atual: "COMEÇAR +15 XP" (XP estático, #60). */}
      {node.state === "current" && (
        <div className="animate-bounce-gentle absolute bottom-full mb-1 flex items-center space-x-1 whitespace-nowrap rounded-full border border-emerald-400/60 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 shadow-lg">
          <span>COMEÇAR</span>
          <span className="font-extrabold text-amber-500">+15 XP</span>
        </div>
      )}

      <button
        type="button"
        disabled={locked}
        aria-disabled={locked}
        aria-label={`${node.title} — ${stateLabel}`}
        onClick={() => onOpen(node)}
        className={nodeButtonClass(node.state)}
      >
        <NodeGlyph state={node.state} />
      </button>

      {/* Estrelas — ENFEITE ESTÁTICO (placeholder #60): sempre três, sem
          pontuação real. Douradas no concluído, apagadas no resto. */}
      <div
        aria-hidden
        className={`mt-1 flex space-x-1 text-xs ${
          node.state === "answered" ? "text-amber-400" : "text-slate-300"
        }`}
      >
        <span>★</span>
        <span>★</span>
        <span>★</span>
      </div>
    </div>
  );
}

/** As classes de cada nó, com o relevo tátil (sombra 3D) do home.html. */
function nodeButtonClass(state: JourneyNode["state"]): string {
  const base =
    "flex items-center justify-center rounded-full transition-all active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  if (state === "answered") {
    return `${base} size-16 border-4 border-[#22c55e] bg-[#4ade80] shadow-[0_6px_0_#15803d]`;
  }
  if (state === "current") {
    return `${base} size-[72px] border-4 border-[#16a34a] bg-[#22c55e] shadow-[0_6px_0_#16a34a] ring-4 ring-emerald-300/40`;
  }
  return `${base} size-16 cursor-not-allowed border-4 border-slate-300 bg-slate-200 shadow-[0_5px_0_#9ca3af]`;
}

/** O ícone de cada estado: broto colhido, regador, ou cadeado. */
function NodeGlyph({ state }: { state: JourneyNode["state"] }) {
  if (state === "answered") {
    return <span className="text-2xl drop-shadow-sm">🌱</span>;
  }
  if (state === "current") {
    return <span className="text-3xl text-white drop-shadow">🚿</span>;
  }
  return (
    <svg className="size-6 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z"
      />
    </svg>
  );
}
