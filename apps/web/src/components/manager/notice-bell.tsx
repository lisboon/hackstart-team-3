"use client";

import { Bell } from "lucide-react";
import { useManagerData } from "@/components/manager/manager-data";
import { ICON_STROKE } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UnitIndicators } from "@/schemas/organization";

type Notice = { id: string; title: string; detail: string };

/**
 * Os avisos são função dos indicadores que a tela já recebeu — não há rota de
 * notificação, nem nada guardado. Se o painel não sabe, o sino não inventa.
 *
 * Tudo é de unidade. Nenhum aviso pode falar de uma pessoa, e é por isso que
 * não existe "fulano não declarou" aqui.
 */
export function noticesFrom(data: UnitIndicators | null): Notice[] {
  if (!data) return [];

  if (data.suppressed)
    return [
      {
        id: "suppressed",
        title: "Dados insuficientes para exibir a unidade",
        detail:
          "Os números só aparecem quando há pessoas suficientes para que nenhuma delas seja identificável por trás da média.",
      },
    ];

  const notices: Notice[] = [];

  if (data.supportUses !== null && data.supportUses > 0)
    notices.push({
      id: "support",
      title: `${data.supportUses} aberturas de canais de apoio neste mês`,
      detail:
        "Contagem da unidade, sem identificar quem abriu. Vale considerar levar um assessor ou marcar uma conversa.",
    });

  const before = data.previous?.tightRatio ?? null;
  if (data.tightRatio !== null && before !== null) {
    const points = Math.round((data.tightRatio - before) * 100);
    if (Math.abs(points) >= 1)
      notices.push({
        id: "tight",
        title: `Quem declara aperto ${points > 0 ? "subiu" : "caiu"} ${Math.abs(points)} pontos`,
        detail:
          "Comparado ao mês anterior, entre as pessoas que declararam o mês.",
      });
  }

  if (data.accessSeries !== null && data.accessSeries.length === 0)
    notices.push({
      id: "empty",
      title: "Nenhum registro ainda neste mês",
      detail: "O gráfico de acessos preenche conforme a unidade usa o app.",
    });

  return notices;
}

export function NoticeBell() {
  const { data } = useManagerData();
  const notices = noticesFrom(data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            notices.length
              ? `Avisos: ${notices.length}`
              : "Avisos: nenhum"
          }
        >
          <Bell aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
          {notices.length > 0 && (
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground">
              {notices.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[320px] max-w-[420px]">
        <DropdownMenuLabel>Avisos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notices.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            Nada por aqui. Os avisos saem dos indicadores da unidade — quando
            não há o que dizer, esta lista fica vazia.
          </p>
        ) : (
          <ul className="grid gap-1 py-1">
            {notices.map((notice) => (
              <li key={notice.id} className="grid gap-0.5 px-2 py-2">
                <span className="text-sm font-semibold">{notice.title}</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {notice.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
