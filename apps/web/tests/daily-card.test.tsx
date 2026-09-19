import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyCard } from "@/components/journey/daily-card";
import type { ContentPiece, PieceAnswer } from "@/schemas/wellbeing";

const piece: ContentPiece = {
  id: "8b3d5f7a-2c4e-4d6f-9a1b-3c5d7e9f0a1b",
  stage: "PREPARAR",
  title: "O imprevisto não avisa",
  body: "Preparar é ter alguma folga antes de precisar.",
  prompt: "Sobraram R$ 50 este mês. O que fazer?",
  options: [
    { label: "Guardar, mesmo sendo pouco" },
    { label: "Deixar na conta, R$ 50 não muda nada" },
  ],
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const answered: PieceAnswer = {
  outcome: "Costuma sumir até o meio do mês.",
  comprehended: false,
  sourceUrl: piece.sourceUrl,
};

afterEach(cleanup);

describe("DailyCard", () => {
  it("shows the stage, the lesson and every option", () => {
    render(
      <DailyCard piece={piece} answer={null} pending={false} onDecide={vi.fn()} />,
    );

    expect(screen.getByText("Preparar")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: piece.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(piece.prompt)).toBeInTheDocument();
    for (const option of piece.options) {
      expect(
        screen.getByRole("button", { name: option.label }),
      ).toBeInTheDocument();
    }
  });

  it("reports the chosen label so the server decides what it means", async () => {
    const onDecide = vi.fn();
    render(
      <DailyCard
        piece={piece}
        answer={null}
        pending={false}
        onDecide={onDecide}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar, mesmo sendo pouco" }),
    );

    expect(onDecide).toHaveBeenCalledWith("Guardar, mesmo sendo pouco");
  });

  it("never reveals a consequence before the person chooses", () => {
    render(
      <DailyCard piece={piece} answer={null} pending={false} onDecide={vi.fn()} />,
    );

    // A consequência só existe no servidor até a escolha: se vazasse para a
    // tela, não seria decisão, seria gabarito.
    expect(screen.queryByText(answered.outcome)).not.toBeInTheDocument();
  });

  it("shows the outcome without treating a mismatched choice as an error", () => {
    render(
      <DailyCard
        piece={piece}
        answer={answered}
        pending={false}
        onDecide={vi.fn()}
      />,
    );

    expect(screen.getByText(answered.outcome)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/errad/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tentar de novo/i }),
    ).not.toBeInTheDocument();
  });

  it("moves focus to the outcome so a screen reader notices the change", () => {
    render(
      <DailyCard
        piece={piece}
        answer={answered}
        pending={false}
        onDecide={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: piece.title })).toHaveFocus();
  });

  it("credits the source in both states", () => {
    const { rerender } = render(
      <DailyCard piece={piece} answer={null} pending={false} onDecide={vi.fn()} />,
    );
    expect(
      screen.getByRole("link", { name: /Cooperação na Ponta do Lápis/ }),
    ).toHaveAttribute("href", piece.sourceUrl);

    rerender(
      <DailyCard
        piece={piece}
        answer={answered}
        pending={false}
        onDecide={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Cooperação na Ponta do Lápis/ }),
    ).toHaveAttribute("href", answered.sourceUrl);
  });

  it("blocks a second tap while the choice is in flight", () => {
    render(
      <DailyCard piece={piece} answer={null} pending onDecide={vi.fn()} />,
    );

    for (const option of piece.options) {
      expect(screen.getByRole("button", { name: option.label })).toBeDisabled();
    }
  });
});
