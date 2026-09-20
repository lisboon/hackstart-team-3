import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalCard } from "@/components/savings-goal/goal-card";
import { GoalCreation } from "@/components/savings-goal/goal-creation";
import type { Goal } from "@/schemas/savings-goal";

const goal = (overrides: Partial<Goal>): Goal => ({
  id: "11111111-1111-4111-8111-111111111111",
  kind: "MONTHLY",
  status: "ACTIVE",
  startMonth: "2026-09-01T00:00:00.000Z",
  targetMonths: 1,
  monthsMet: 0,
  currentMonthMet: false,
  termEndedUnmet: false,
  ...overrides,
});

afterEach(cleanup);

describe("GoalCard", () => {
  it("mostra a meta do mês para uma meta mensal", () => {
    render(
      <GoalCard
        goal={goal({})}
        pending={false}
        onExtend={vi.fn()}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByText(/Sua colheita do mês/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Meta do mês/ })).toBeInTheDocument();
  });

  it("mostra X de N para uma meta duradoura", () => {
    render(
      <GoalCard
        goal={goal({ kind: "ENDURING", targetMonths: 6, monthsMet: 2 })}
        pending={false}
        onExtend={vi.fn()}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByText(/2 de 6 meses/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /2 de 6 meses guardados/ }),
    ).toBeInTheDocument();
  });

  it("nunca mostra valor em dinheiro", () => {
    const { container } = render(
      <GoalCard
        goal={goal({ kind: "ENDURING", targetMonths: 6, monthsMet: 2 })}
        pending={false}
        onExtend={vi.fn()}
        onEnd={vi.fn()}
      />,
    );
    expect(container.textContent).not.toMatch(/R\$|reais|saldo/i);
  });
});

describe("GoalCard — fim de prazo acolhedor", () => {
  const ended = goal({
    kind: "ENDURING",
    targetMonths: 3,
    monthsMet: 1,
    termEndedUnmet: true,
  });

  it("acolhe sem vermelho e sem 'você falhou'", () => {
    render(
      <GoalCard goal={ended} pending={false} onExtend={vi.fn()} onEnd={vi.fn()} />,
    );
    expect(screen.getByText(/continua sendo seu/)).toBeInTheDocument();
    expect(screen.queryByText(/falhou|falha|errado/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("estende o prazo", async () => {
    const onExtend = vi.fn();
    render(
      <GoalCard goal={ended} pending={false} onExtend={onExtend} onEnd={vi.fn()} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Dar mais três meses/ }),
    );
    expect(onExtend).toHaveBeenCalledWith(ended.id, 6);
  });

  it("encerra com motivo em opção fechada, sem texto livre", async () => {
    const onEnd = vi.fn();
    render(
      <GoalCard goal={ended} pending={false} onExtend={vi.fn()} onEnd={onEnd} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Encerrar esta meta/ }),
    );

    // Não há campo de texto para relatar o motivo.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /despesa fora do previsto/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /^Encerrar$/ }));
    expect(onEnd).toHaveBeenCalledWith(ended.id, "UNEXPECTED_EXPENSE");
  });

  it("encerra sem motivo quando a pessoa não escolhe nenhum", async () => {
    const onEnd = vi.fn();
    render(
      <GoalCard goal={ended} pending={false} onExtend={vi.fn()} onEnd={onEnd} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Encerrar esta meta/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /^Encerrar$/ }));
    expect(onEnd).toHaveBeenCalledWith(ended.id, undefined);
  });
});

describe("GoalCreation", () => {
  it("cria uma meta mensal sem prazo", async () => {
    const onCreate = vi.fn();
    render(<GoalCreation pending={false} onCreate={onCreate} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Guardar este mês/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Criar meta/ }));
    expect(onCreate).toHaveBeenCalledWith("MONTHLY", undefined);
  });

  it("cria uma meta duradoura com prazo em meses", async () => {
    const onCreate = vi.fn();
    render(<GoalCreation pending={false} onCreate={onCreate} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Manter a guarda/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /3 meses/ }));
    await userEvent.click(screen.getByRole("button", { name: /Criar meta/ }));
    expect(onCreate).toHaveBeenCalledWith("ENDURING", 3);
  });

  it("não deixa criar sem escolher o tipo", () => {
    render(<GoalCreation pending={false} onCreate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Criar meta/ })).toBeDisabled();
  });
});
