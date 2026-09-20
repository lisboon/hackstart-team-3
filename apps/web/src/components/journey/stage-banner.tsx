import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { StageSection } from "@/components/journey/coops-sections";

/**
 * A faixa de uma etapa do COOPS, grudenta no topo enquanto a serpentina dela
 * rola — é o padrão do cabeçalho de unidade do Duolingo, e é o que dá ritmo
 * vertical a uma tela que o manual da marca manda ser branca.
 *
 * É a **única superfície preenchida** do mapa: o cartão em volta perdeu fundo,
 * borda e sombra de propósito. Quatro brancos empilhados não davam hierarquia
 * nenhuma; uma faixa sólida a cada etapa dá.
 */
export function StageBanner({ section }: { section: StageSection }) {
  const { stage, total, answered, state } = section;
  // "trancada" em vez de "0 de 6": a etapa que nem começou não precisa de
  // número, precisa de aviso de que ainda não é a vez dela.
  const progress =
    state === "locked" && answered === 0
      ? "ainda trancada"
      : `${answered} de ${total}`;

  return (
    <header className="sticky top-0 z-20 -mx-1 flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-md">
      <div className="min-w-0">
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground/85">
          Método COOPS
        </span>
        <h2 className="truncate text-base font-bold leading-snug">
          {STAGE_LABEL[stage]}
        </h2>
      </div>
      <span className="shrink-0 rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-bold tabular-nums">
        {progress}
      </span>
    </header>
  );
}
