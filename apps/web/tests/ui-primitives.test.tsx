import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatTile } from "@/components/ui/stat-tile";

afterEach(cleanup);

describe("Avatar", () => {
  it("draws the initials without announcing them twice", () => {
    const { container } = render(<Avatar initials="AF" />);
    // Quem usa sempre desenha o nome ao lado; "AF" antes de "Ana Ferreira" só
    // atrasa a leitura.
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("AF")).toBeInTheDocument();
  });

  it("prefers the picture when the record has one", () => {
    const { container } = render(
      <Avatar initials="AF" src="https://example.test/a.png" />,
    );
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "https://example.test/a.png");
    // Decorativo: o retrato não acrescenta informação ao nome já escrito.
    expect(image).toHaveAttribute("alt", "");
    expect(screen.queryByText("AF")).toBeNull();
  });
});

describe("Badge", () => {
  it("carries the state as text, not only as colour", () => {
    render(<Badge variant="achieved">Conquistado</Badge>);
    // WCAG 1.4.1: cor é reforço. Sem o texto, quem não distingue âmbar de
    // verde não saberia o estado.
    expect(screen.getByText("Conquistado")).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("describes the progress for assistive technology when it informs", () => {
    render(<ProgressBar ratio={0.5} label="Trilha: metade andada" />);
    expect(
      screen.getByRole("img", { name: "Trilha: metade andada" }),
    ).toBeInTheDocument();
  });

  it("stays silent when the text beside it already tells the story", () => {
    render(<ProgressBar ratio={0.5} decorative />);
    // Uma barra que repete o texto ao lado faz o leitor de tela dizer tudo
    // duas vezes.
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("clamps a ratio that came out of range", () => {
    // Uma razão fora de 0..1 vem de divisão por contagem do servidor: preencher
    // 900% da barra vazaria do cartão.
    const fill = (root: HTMLElement) =>
      root.firstElementChild?.firstElementChild;
    const { container } = render(<ProgressBar ratio={9} decorative />);
    expect(fill(container)).toHaveStyle({ width: "100%" });
    cleanup();
    const below = render(<ProgressBar ratio={-1} decorative />);
    expect(fill(below.container)).toHaveStyle({ width: "0%" });
  });
});

describe("StatTile", () => {
  it("pairs the label with the value as a definition", () => {
    render(
      <dl>
        <StatTile label="Meses declarados" value="4" />
      </dl>,
    );
    // dt/dd fazem o leitor de tela anunciar "Meses declarados, 4" em vez de
    // dois textos soltos.
    const term = screen.getByText("Meses declarados");
    const value = screen.getByText("4");
    expect(term.tagName).toBe("DT");
    expect(value.tagName).toBe("DD");
    // A especificação da `dl` pede o termo antes da definição no documento; o
    // valor sobe para cima por CSS, não trocando a ordem do DOM.
    expect(term.compareDocumentPosition(value)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});

describe("ListRow", () => {
  it("is a button by default and reachable by keyboard", async () => {
    const onClick = vi.fn();
    render(<ListRow label="Trocar senha" hint="Encerra a sessão" onClick={onClick} />);
    const row = screen.getByRole("button", { name: /Trocar senha/ });
    expect(row.className).toMatch(/min-h-12/);
    row.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("announces the disclosure state it was given", () => {
    render(
      <ListRow
        label="Privacidade"
        aria-expanded={false}
        aria-controls="panel"
      />,
    );
    // A linha abre um painel, e quem usa leitor de tela precisa saber disso
    // antes de acionar.
    const row = screen.getByRole("button", { name: /Privacidade/ });
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(row).toHaveAttribute("aria-controls", "panel");
  });
});
