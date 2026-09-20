import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MoodBadge } from "@/components/wellbeing/mood-badge";

afterEach(cleanup);

describe("MoodBadge", () => {
  it("mostra o sentimento registrado do dia com a palavra, não só ícone", () => {
    render(<MoodBadge mood={5} />);
    expect(screen.getByText("Como você está hoje")).toBeInTheDocument();
    expect(screen.getByText("Ótimo")).toBeInTheDocument();
  });

  it("é só leitura: não oferece botão para trocar o humor", () => {
    render(<MoodBadge mood={2} />);
    expect(screen.getByText("Triste")).toBeInTheDocument();
    // Uma resposta por dia, sem correção: nada de botões de seleção aqui.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/Amanhã tem outro dia/)).toBeInTheDocument();
  });

  it("mapeia cada nível da escala ao sentimento correspondente", () => {
    const cases: [1 | 2 | 3 | 4 | 5, string][] = [
      [1, "Muito triste"],
      [3, "Mais ou menos"],
      [4, "Bem"],
    ];
    for (const [mood, label] of cases) {
      const { unmount } = render(<MoodBadge mood={mood} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
