import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WeeklyHarvestCard } from "@/components/streak/weekly-harvest-card";
import type { Streak } from "@/schemas/streak";

const streak = (overrides: Partial<Streak>): Streak => ({
  currentStreak: 2,
  longestStreak: 5,
  week: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-09-1${i}T00:00:00.000Z`,
    weekday: i,
    state: i < 2 ? "done" : i === 2 ? "today" : "future",
  })),
  freezesAvailable: 1,
  freezeApplied: false,
  ...overrides,
});

afterEach(cleanup);

describe("WeeklyHarvestCard", () => {
  it("mostra a ofensiva atual e o recorde como pessoal", () => {
    render(<WeeklyHarvestCard streak={streak({})} />);
    expect(screen.getByText(/2 dias de Colheita/)).toBeInTheDocument();
    // Recorde é do próprio usuário, nunca comparação.
    expect(screen.getByText(/Seu recorde: 5 dias/)).toBeInTheDocument();
  });

  it("mostra os sete dias com rótulo textual do estado (não só cor)", () => {
    render(<WeeklyHarvestCard streak={streak({})} />);
    expect(screen.getByLabelText(/SEG: cumprido/)).toBeInTheDocument();
    expect(screen.getByLabelText(/QUA: hoje/)).toBeInTheDocument();
    expect(screen.getByLabelText(/DOM: ainda por vir/)).toBeInTheDocument();
  });

  it("mostra a proteção disponível quando nada foi congelado", () => {
    render(<WeeklyHarvestCard streak={streak({})} />);
    expect(
      screen.getByText(/1 congelamento disponível para imprevistos/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ativa/)).toBeInTheDocument();
  });

  it("marca um dia protegido sem tom de falha, quando o congelamento foi usado", () => {
    const s = streak({ freezeApplied: true, freezesAvailable: 0 });
    s.week[1].state = "protected";
    render(<WeeklyHarvestCard streak={s} />);
    expect(screen.getByLabelText(/TER: protegido/)).toBeInTheDocument();
    expect(screen.getByText(/sua ofensiva seguiu firme/)).toBeInTheDocument();
    expect(screen.queryByText(/falhou|falha|perdeu/i)).not.toBeInTheDocument();
  });

  it("mostra o dia sem expediente como tal, nunca como falta", () => {
    // Fim de semana, feriado, recesso: nao havia diaria a fazer, entao a tela
    // nao tem o que cobrar (#77).
    const s = streak({});
    s.week[5].state = "closed";
    s.week[6].state = "closed";
    render(<WeeklyHarvestCard streak={s} />);
    expect(screen.getAllByLabelText(/sem expediente/)).toHaveLength(2);
    expect(screen.queryByLabelText(/sem registro/)).not.toBeInTheDocument();
  });

  it("acolhe uma ofensiva zerada, sem culpa", () => {
    render(
      <WeeklyHarvestCard
        streak={streak({ currentStreak: 0, longestStreak: 0 })}
      />,
    );
    expect(screen.getByText(/0 dias de Colheita/)).toBeInTheDocument();
    expect(screen.getByText(/A colheita começa quando você abre o dia/)).toBeInTheDocument();
  });
});
