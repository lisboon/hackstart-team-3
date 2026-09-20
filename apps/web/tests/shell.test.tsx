import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

afterEach(cleanup);

describe("AppShell", () => {
  it("keeps the emergency line one tap away from any screen", () => {
    render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    // Vale inclusive antes do login: o app coleta sofrimento e o acesso a
    // emergencia nao pode depender de a pessoa ter entrado.
    const line = screen.getByRole("link", { name: /CVV 188/ });
    expect(line).toHaveAttribute("href", "tel:188");
  });

  it("states that it does not diagnose, as Anexo V 5.III requires", () => {
    render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    expect(screen.getByText(/não faz diagnóstico/i)).toBeInTheDocument();
  });

  it("declares the data as fictional, as Anexo V 4.4 requires", () => {
    render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    // O histórico da demonstração é inventado. Deixar isso implícito seria
    // deixar o avaliador supor que os números vieram de gente real.
    expect(screen.getByText(/dados fictícios/i)).toBeInTheDocument();
  });

  it("holds the journey inside a phone-sized column", () => {
    const { container } = render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    // A largura maxima e o que separa "app de celular" de "pagina esticada"
    // num monitor de 1920px.
    const frame = container.querySelector("main");
    expect(frame?.className).toMatch(/max-w-\[393px\]/);
  });

  it("measures height in dvh, not vh", () => {
    const { container } = render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    // A barra do navegador movel aparece e some: com vh o rodape fica cortado
    // metade do tempo.
    const frame = container.querySelector("main");
    expect(frame?.className).toMatch(/h-\[100dvh\]/);
    expect(frame?.className).not.toMatch(/h-screen/);
  });

  it("scrolls inside the frame so the footer stays put", () => {
    const { container } = render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
  });

  it("sizes the frame like an iPhone 16, and lets it give way", () => {
    const { container } = render(
      <AppShell>
        <p>conteúdo</p>
      </AppShell>,
    );

    const frame = container.querySelector("main");
    // 393 x 852 sao os pontos logicos do aparelho. A altura cede pelo min():
    // travada, em janela baixa a moldura passa do fim da tela.
    expect(frame?.className).toMatch(/md:h-\[min\(852px,/);
    // Largura e teto, nao medida: num aparelho de 375 pontos ela encolhe.
    expect(frame?.className).toMatch(/\bw-full\b/);
    expect(frame?.className).not.toMatch(/(?<!max-)\bw-\[\d+px\]/);
  });
});
