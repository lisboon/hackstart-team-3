import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

afterEach(cleanup);

describe("AppShell", () => {
  it("no longer carries the safety footer — it lives on the profile now", () => {
    render(
      <AppShell>
        <p>qualquer tela</p>
      </AppShell>,
    );

    // Decisão de produto: o bloco de segurança saiu de toda tela e passou a
    // viver só no Perfil (ver SafetyFooter).
    expect(screen.queryByRole("link", { name: /CVV 188/ })).toBeNull();
    expect(screen.queryByText(/não faz diagnóstico/i)).toBeNull();
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

  it("is the same phone frame at every width", () => {
    const { container } = render(
      <AppShell>
        <p>conteudo</p>
      </AppShell>,
    );

    const frame = container.querySelector("main");
    // No celular: largura de aparelho e rolagem presa dentro da moldura.
    expect(frame?.className).toMatch(/max-w-\[393px\]/);
    expect(frame?.className).toMatch(/\bh-\[100dvh\]/);
    // O app do trabalhador e de celular em qualquer largura. Um `md:`
    // aqui significa uma segunda forma para manter, e ja foi tentada
    // duas vezes.
    expect(frame?.className).not.toMatch(/\bmd:/);
  });
});
