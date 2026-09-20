"use client";

import { cn } from "@/lib/utils";
import type { Progress } from "@/schemas/progress";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * O mês da pessoa como uma grade de dias: dia com registro é preenchido, dia
 * sem registro é uma célula vazia.
 *
 * **Vazio não é erro.** Sem vermelho, sem "você falhou", sem sequência a
 * perder — a tela mostra o que a pessoa já conseguiu, nunca o que faltou. É a
 * mesma regra que faz `Goal.status` não ter o valor "falhou".
 */
export function MonthHistogram({ progress }: { progress: Progress }) {
  const month = new Date(progress.month);
  const name = MONTHS[month.getUTCMonth()];
  const recorded = new Set(progress.days);

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
      <header>
        <h2 className="text-sm font-extrabold leading-tight">
          {progress.total} {progress.total === 1 ? "dia" : "dias"} em {name}
        </h2>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {progress.total > 0
            ? "Cada quadrado cheio é um dia que você abriu."
            : "O mês está começando para você. Cada dia aberto aparece aqui."}
        </p>
      </header>

      <ul
        aria-label={`Dias de ${name} com registro`}
        className="m-0 grid list-none grid-cols-7 gap-1.5 p-0"
      >
        {Array.from({ length: progress.daysInMonth }, (_, i) => {
          const dayNumber = i + 1;
          const done = recorded.has(dayNumber);
          return (
            <li key={dayNumber}>
              <span
                aria-label={`Dia ${dayNumber}: ${done ? "com registro" : "sem registro"}`}
                className={cn(
                  "grid h-7 w-full place-items-center rounded-md text-[10px] font-bold tabular-nums",
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground/60",
                )}
              >
                {dayNumber}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
