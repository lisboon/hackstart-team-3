"use client";

import { cn } from "@/lib/utils";
import type { Streak, WeekDayState } from "@/schemas/streak";

const WEEKDAY_LABEL = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const STATE_TEXT: Readonly<Record<WeekDayState, string>> = {
  done: "cumprido",
  today: "hoje",
  future: "ainda por vir",
  missed: "sem registro",
  protected: "protegido",
};

/**
 * O cartão de Colheita Semanal na Home, no visual do `stitch/home.html`:
 * contador de dias seguidos, recorde pessoal, os sete dias da semana e a
 * proteção da ofensiva.
 *
 * Regra: a ofensiva é contra o próprio passado — o recorde é só da pessoa,
 * nunca comparação. Um dia perdido não é humilhação: a proteção o cobre, e o
 * estado de cada dia vem por ícone + rótulo em texto, não só por cor.
 */
export function WeeklyHarvestCard({ streak }: { streak: Streak }) {
  return (
    <section className="relative space-y-3.5 overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-sm">
            🔥
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-foreground/80">
            Colheita semanal
          </span>
        </div>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold text-primary-foreground/90">
          Seu recorde: {streak.longestStreak}{" "}
          {streak.longestStreak === 1 ? "dia" : "dias"}
        </span>
      </div>

      <div>
        <h2 className="text-base font-extrabold leading-tight">
          {streak.currentStreak}{" "}
          {streak.currentStreak === 1 ? "dia" : "dias"} de Colheita
        </h2>
        <p className="mt-1 text-xs leading-snug text-primary-foreground/80">
          {streak.currentStreak > 0
            ? "Você está cultivando seus hábitos, um dia de cada vez."
            : "Um dia de cada vez. A colheita começa quando você abre o dia."}
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-7 gap-1.5 p-0">
        {streak.week.map((day, i) => (
          <li key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-primary-foreground/70">
              {WEEKDAY_LABEL[i]}
            </span>
            <span
              aria-label={`${WEEKDAY_LABEL[i]}: ${STATE_TEXT[day.state]}`}
              className={cn(
                "grid size-8 place-items-center rounded-full text-xs font-bold",
                dayClass(day.state),
              )}
            >
              <span aria-hidden>{dayGlyph(day.state)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/10 p-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-sm">
            🧊
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold">Proteção de Colheita</p>
            <p className="text-[10px] text-primary-foreground/80">
              {streak.freezeApplied
                ? "Um dia foi protegido — sua ofensiva seguiu firme."
                : `${streak.freezesAvailable} congelamento disponível para imprevistos`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase">
          {streak.freezeApplied ? "Usado" : "Ativa"}
        </span>
      </div>
    </section>
  );
}

function dayClass(state: WeekDayState): string {
  switch (state) {
    case "done":
      return "bg-white text-primary";
    case "protected":
      return "bg-sky-200 text-sky-900";
    case "today":
      return "bg-amber-300 text-amber-950 ring-2 ring-white";
    default:
      return "bg-black/10 text-primary-foreground/70";
  }
}

function dayGlyph(state: WeekDayState): string {
  switch (state) {
    case "done":
      return "✓";
    case "protected":
      return "🧊";
    case "today":
      return "🌱";
    default:
      return "·";
  }
}
