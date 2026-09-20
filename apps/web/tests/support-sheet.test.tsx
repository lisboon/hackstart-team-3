import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SafetyFooter } from "@/components/layout/safety-footer";

afterEach(cleanup);

function shell() {
  return render(<SafetyFooter />);
}

const trigger = () => screen.getByRole("button", { name: /apoio disponível/i });

describe("aba de apoio", () => {
  it("fica alcançável a partir do rodapé de segurança (no Perfil)", () => {
    shell();

    // O gatilho vive no rodapé de segurança, que agora fica no Perfil.
    expect(trigger()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("não deixa o conteúdo na tela antes de alguém pedir", () => {
    shell();

    expect(screen.queryByRole("dialog")).toBeNull();
    // O CVV do rodapé continua único: dois links iguais confundiriam leitor de
    // tela e derrubariam o portão do shell.
    expect(screen.getAllByRole("link", { name: /CVV 188/ })).toHaveLength(1);
  });

  it("abre com os cinco caminhos, o gestor por último e o CVV", async () => {
    shell();
    await userEvent.click(trigger());

    const panel = screen.getByRole("dialog");
    const paths = within(panel)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(paths).toHaveLength(5);
    expect(paths[0]).not.toMatch(/gestor/i);
    expect(paths.at(-1)).toMatch(/gestor/i);
    expect(within(panel).getByRole("link", { name: /CVV 188/ })).toHaveAttribute(
      "href",
      "tel:188",
    );
    expect(within(panel).getByText(/não faz diagnóstico/i)).toBeInTheDocument();
  });

  it("leva o foco para o painel e devolve ao gatilho ao fechar", async () => {
    shell();
    await userEvent.click(trigger());

    const title = screen.getByRole("heading", { name: "Com quem falar" });
    expect(title).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("fecha no Escape, como qualquer painel do sistema", async () => {
    shell();
    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("anuncia o estado em atributo, não só em cor", async () => {
    shell();
    await userEvent.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("dá alvo de toque confortável ao gatilho e ao fechar", async () => {
    shell();
    // 44px é o mínimo; o público usa o app em pé, no celular, muitas vezes de
    // luva.
    expect(trigger().className).toMatch(/min-h-11/);
    await userEvent.click(trigger());
    expect(screen.getByRole("button", { name: "Fechar" }).className).toMatch(
      /min-h-11/,
    );
  });
});
