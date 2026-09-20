import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JourneyMap } from "@/components/journey/journey-map";
import { AnsweredPieceReview } from "@/components/journey/answered-piece-review";
import type { JourneyNode } from "@/schemas/wellbeing";

const answered: JourneyNode = {
  id: "11111111-1111-4111-8111-111111111111",
  stage: "CONSCIENTIZAR",
  orderInStage: 1,
  title: "Dinheiro também é emoção",
  state: "answered",
  body: "Corpo da peça.",
  prompt: "O que você faz?",
  options: null,
  answer: "Fecho e deixo para depois",
  outcome: "Costuma sumir até o meio do mês.",
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const current: JourneyNode = {
  id: "22222222-2222-4222-8222-222222222222",
  stage: "OBSERVAR",
  orderInStage: 1,
  title: "Para onde o dinheiro foi",
  state: "current",
  body: "Corpo da peça atual.",
  prompt: "Sobrou R$ 50. O que faz?",
  options: [{ label: "Guardo" }, { label: "Gasto" }],
  answer: null,
  outcome: null,
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const locked: JourneyNode = {
  id: "33333333-3333-4333-8333-333333333333",
  stage: "ORGANIZAR",
  orderInStage: 1,
  title: "Um teto para cada gasto",
  state: "locked",
  body: null,
  prompt: null,
  options: null,
  answer: null,
  outcome: null,
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const nodes = [answered, current, locked];

afterEach(cleanup);

describe("JourneyMap", () => {
  it("shows every node with its title in the accessible label", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    for (const node of nodes) {
      expect(
        screen.getByRole("button", { name: new RegExp(node.title) }),
      ).toBeInTheDocument();
    }
  });

  it("names the state in text, not only by color, for each node", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Concluída/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Peça de hoje/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ainda trancada/ }),
    ).toBeInTheDocument();
  });

  it("opens the current piece when its node is tapped", async () => {
    const onOpen = vi.fn();
    render(<JourneyMap nodes={nodes} onOpen={onOpen} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Para onde o dinheiro foi/ }),
    );

    expect(onOpen).toHaveBeenCalledWith(current);
  });

  it("opens a concluded piece for reading when its node is tapped", async () => {
    const onOpen = vi.fn();
    render(<JourneyMap nodes={nodes} onOpen={onOpen} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Dinheiro também é emoção/ }),
    );

    expect(onOpen).toHaveBeenCalledWith(answered);
  });

  it("does not navigate from a locked node", async () => {
    const onOpen = vi.fn();
    render(<JourneyMap nodes={nodes} onOpen={onOpen} />);

    const lockedButton = screen.getByRole("button", {
      name: /Um teto para cada gasto/,
    });
    expect(lockedButton).toBeDisabled();
    expect(lockedButton).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(lockedButton);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("shows the call to action on the current node", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    // Os pontos deixaram de ser enfeite: o cliente aprovou brinde por ponto, e
    // o número vem do que a pessoa respondeu. "pontos", e não "XP", porque é a
    // palavra do programa de brindes.
    expect(screen.getByText("COMEÇAR")).toBeInTheDocument();
    expect(screen.getByText("+15 pontos")).toBeInTheDocument();
  });

  it("calls to action on the current node only, never per stage", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    // Uma chamada só na tela: uma por etapa faria a pessoa procurar qual é a
    // de hoje, que é exatamente o que o mapa existe para responder.
    expect(screen.getAllByText("COMEÇAR")).toHaveLength(1);
  });

  it("shows each COOPS stage as its own section", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    // O método é o produto. As três etapas com peça aparecem nomeadas, na
    // ordem do COOPS.
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(["Conscientizar", "Observar", "Organizar"]);
  });

  it("counts how far the person got in each stage", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    // Conscientizar tem uma peça e ela foi respondida; Organizar nem começou.
    expect(screen.getByText("1 de 1")).toBeInTheDocument();
    expect(screen.getByText("ainda trancada")).toBeInTheDocument();
  });

  it("never leaks the body of a locked node", () => {
    render(<JourneyMap nodes={nodes} onOpen={vi.fn()} />);

    // Trancada é só rótulo: corpo na tela seria gabarito.
    expect(screen.queryByText(/Corpo/)).not.toBeInTheDocument();
  });
});

describe("AnsweredPieceReview", () => {
  it("shows the chosen answer and its outcome, read-only", () => {
    render(<AnsweredPieceReview node={answered} onBack={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: answered.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(answered.answer!)).toBeInTheDocument();
    expect(screen.getByText(answered.outcome!)).toBeInTheDocument();
  });

  it("offers no way to answer again", () => {
    render(<AnsweredPieceReview node={answered} onBack={vi.fn()} />);

    // A decisão não se refaz: nenhum botão de opção, só voltar.
    expect(
      screen.queryByRole("button", { name: answered.answer! }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Voltar à trilha/ }),
    ).toBeInTheDocument();
  });

  it("moves focus to the title so a screen reader notices the change", () => {
    render(<AnsweredPieceReview node={answered} onBack={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: answered.title }),
    ).toHaveFocus();
  });

  it("goes back to the trail when asked", async () => {
    const onBack = vi.fn();
    render(<AnsweredPieceReview node={answered} onBack={onBack} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Voltar à trilha/ }),
    );
    expect(onBack).toHaveBeenCalled();
  });

  it("credits the source", () => {
    render(<AnsweredPieceReview node={answered} onBack={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: /Cooperação na Ponta do Lápis/ }),
    ).toHaveAttribute("href", answered.sourceUrl);
  });
});
