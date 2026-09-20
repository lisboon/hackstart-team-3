import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MonthHistogram } from "@/components/progress/month-histogram";
import type { Progress } from "@/schemas/progress";

const progress = (overrides: Partial<Progress> = {}): Progress => ({
  month: "2026-09-01T00:00:00.000Z",
  daysInMonth: 30,
  days: [1, 3, 4],
  total: 3,
  ...overrides,
});

afterEach(cleanup);

describe("MonthHistogram", () => {
  it("nomeia o mês e conta os dias abertos", () => {
    render(<MonthHistogram progress={progress()} />);
    expect(screen.getByText(/3 dias em setembro/)).toBeInTheDocument();
  });

  it("desenha uma célula por dia do mês", () => {
    render(<MonthHistogram progress={progress()} />);
    expect(screen.getAllByLabelText(/^Dia \d+:/)).toHaveLength(30);
  });

  it("marca os dias com registro e deixa os outros vazios", () => {
    render(<MonthHistogram progress={progress()} />);
    expect(screen.getByLabelText("Dia 1: com registro")).toBeInTheDocument();
    expect(screen.getByLabelText("Dia 2: sem registro")).toBeInTheDocument();
    expect(screen.getByLabelText("Dia 4: com registro")).toBeInTheDocument();
  });

  it("acolhe um mês vazio, sem tom de falha", () => {
    render(<MonthHistogram progress={progress({ days: [], total: 0 })} />);
    expect(screen.getByText(/0 dias em setembro/)).toBeInTheDocument();
    expect(screen.getByText(/O mês está começando para você/)).toBeInTheDocument();
    expect(screen.queryByText(/falhou|falha|perdeu|voc\u00ea deveria/i)).not.toBeInTheDocument();
  });

  it("respeita um mês de 28 dias", () => {
    render(
      <MonthHistogram
        progress={progress({
          month: "2026-02-01T00:00:00.000Z",
          daysInMonth: 28,
          days: [],
          total: 0,
        })}
      />,
    );
    expect(screen.getAllByLabelText(/^Dia \d+:/)).toHaveLength(28);
    expect(screen.getByText(/0 dias em fevereiro/)).toBeInTheDocument();
  });
});
