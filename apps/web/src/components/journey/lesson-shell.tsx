"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ICON_STROKE } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { CoopsStage } from "@/schemas/wellbeing";

/**
 * A moldura de uma lição: sair, onde estou, quanto falta.
 *
 * É o cabeçalho do mockup `atividade_de_colheita_educa_o_financeira`: fechar à
 * esquerda, barra de progresso no meio, pontos à direita. A pessoa entra aqui
 * sabendo que é curto — cinco minutos é a promessa do produto, e a barra é o
 * que a torna visível.
 *
 * O nome da etapa **não** vem daqui: a peça lá dentro já o mostra, e repeti-lo
 * dois centímetros acima só gastaria a tela. Aqui fica o "4 de 6", que é o que
 * falta para completar a leitura.
 *
 * Só desenho: não sabe de transporte e não decide nada.
 */
export function LessonShell({
  stage,
  position,
  total,
  points,
  onClose,
  children,
}: {
  stage: CoopsStage;
  /** A posição desta peça dentro da etapa, a partir de 1. */
  position: number;
  total: number;
  points: number;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <header className="flex items-center gap-3">
        {/*
          "Fechar lição", e nunca "Voltar à trilha": esse nome já é o do botão
          no fim da tela, e dois controles com o mesmo nome acessível deixam de
          ser alcançáveis sem ambiguidade.
        */}
        <button
          type="button"
          aria-label="Fechar lição"
          onClick={onClose}
          className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
        </button>

        <ProgressBar
          ratio={total > 0 ? position / total : 0}
          label={`${STAGE_LABEL[stage]}: peça ${position} de ${total}`}
          className="h-3.5"
        />

        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-achievement-trajectory">
          {points} pts
        </span>
      </header>

      {children}
    </div>
  );
}
