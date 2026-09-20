import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { LoginScreen } from "@/components/auth/login-screen";

const props = { onSubmit: vi.fn(), pending: false, error: "" };

afterEach(cleanup);

describe("LoginScreen", () => {
  it("names the product before asking for credentials", () => {
    render(<LoginScreen {...props} />);

    expect(screen.getByText("Colheita")).toBeInTheDocument();
  });

  it("carries one page heading, and it is the promise", () => {
    render(<LoginScreen {...props} />);

    // A frase é o que a pessoa lê antes de decidir se entra, então ela é o
    // título da página — não a marca, que já está desenhada acima.
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/cinco minutos por dia/i);
  });

  it("highlights part of the promise, the way the reference does", () => {
    render(<LoginScreen {...props} />);

    const heading = screen.getByRole("heading", { level: 1 });
    // Sem o trecho destacado a frase vira legenda: é o contraste dentro dela
    // que faz o olho parar.
    expect(heading.querySelector(".text-primary")).not.toBeNull();
  });

  it("keeps the ornament out of the accessibility tree", () => {
    const { container } = render(<LoginScreen {...props} />);

    // O brilho e a marca d'água não têm o que ler: se entrassem na árvore,
    // um leitor de tela anunciaria duas imagens sem conteúdo antes do campo
    // de e-mail.
    const decorations = container.querySelectorAll(".pointer-events-none");
    expect(decorations.length).toBeGreaterThan(0);
    for (const node of decorations) {
      expect(node).toHaveAttribute("aria-hidden");
    }
  });

  it("still renders the form it exists for", () => {
    render(<LoginScreen {...props} />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("offers no navigation, because there is nowhere to go yet", () => {
    render(<LoginScreen {...props} />);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders one form, not one per layout", () => {
    render(<LoginScreen {...props} />);

    // A referencia monta duas arvores e esconde uma por CSS. Duas copias
    // seriam dois campos com o mesmo rotulo e o mesmo id, e o leitor de tela
    // leria o formulario duas vezes.
    expect(screen.getAllByLabelText(/e-mail/i)).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /entrar/i })).toHaveLength(1);
  });

  it("separates the brand from the form with a glass pane", () => {
    const { container } = render(<LoginScreen {...props} />);

    // A separacao e um painel cobrindo a coluna, nao um cartao em volta do
    // formulario: e o que faz a metade direita existir como superficie.
    expect(container.querySelector(".backdrop-blur-md")).not.toBeNull();
  });
});
