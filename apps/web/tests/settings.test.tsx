import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsView } from "@/components/settings/settings-view";
import {
  SETTINGS_SECTIONS,
  settingsItems,
} from "@/components/settings/settings-presentation";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/perfil/configuracoes",
}));

afterEach(() => {
  cleanup();
  replace.mockReset();
});

function signedIn() {
  sessionStorage.setItem("colheita_token", "session");
  sessionStorage.setItem(
    "colheita_user",
    JSON.stringify({
      id: "1",
      name: "Ana Ferreira",
      email: "ana@x.test",
      role: "USER",
    }),
  );
}

const row = (name: RegExp | string) => screen.getByRole("button", { name });

describe("settings sections", () => {
  it("keeps sign-out as the very last item", () => {
    // Não é estética: o botão morava no topo de toda tela logada, onde o
    // polegar bate nele por acidente.
    const items = settingsItems();
    expect(items.at(-1)?.id).toBe("sign-out");
    expect(SETTINGS_SECTIONS.at(-1)?.items.at(-1)?.label).toBe("Sair");
    // E nenhum outro item encerra a sessão.
    expect(items.filter((item) => item.tone === "danger")).toHaveLength(1);
  });

  it("warns that changing the password ends every session", () => {
    // O servidor chama invalidateTokens(): descobrir isso sendo desconectado
    // no meio do dia seria uma surpresa desnecessária.
    const item = settingsItems().find((entry) => entry.id === "change-password");
    expect(item?.hint).toMatch(/todos os aparelhos/i);
  });
});

describe("SettingsView", () => {
  it("lists every section and offers a way back to the profile", () => {
    signedIn();
    render(<SettingsView token="session" />);

    for (const section of SETTINGS_SECTIONS) {
      expect(
        screen.getByRole("heading", { name: section.title }),
      ).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute(
      "href",
      "/perfil",
    );
  });

  it("says what the company can and cannot see", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    await userEvent.click(row(/O que a sua empresa vê/));

    const panel = screen.getByRole("dialog");
    expect(within(panel).getByText(/somados da unidade/i)).toBeInTheDocument();
    // O piso de cinco pessoas é regra do produto, não detalhe de implementação.
    expect(within(panel).getByText(/menos de 5 pessoas/i)).toBeInTheDocument();
  });

  it("moves focus into the panel and back to the row that opened it", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    const trigger = row(/Sobre o Colheita/);
    await userEvent.click(trigger);

    expect(
      screen.getByRole("heading", { name: "Sobre o Colheita" }),
    ).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes a panel on Escape, like every panel in the system", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    await userEvent.click(row(/Sobre o Colheita/));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the keyboard inside the panel it declared modal", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    await userEvent.click(row(/Trocar senha/));

    const panel = screen.getByRole("dialog");
    const stops = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])',
        ),
      );
    const last = stops().at(-1);
    last?.focus();
    // aria-modal promete que nada fora é alcançável. Sem prender a tabulação, o
    // Tab daqui cairia na lista de Configurações, que continua desenhada atrás.
    await userEvent.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(stops()[0]);

    stops()[0].focus();
    await userEvent.tab({ shift: true });
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(stops().at(-1));
  });

  it("asks before signing out and keeps the session when told to stay", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    await userEvent.click(row(/^Sair/));
    await userEvent.click(screen.getByRole("button", { name: /Continuar no app/ }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(sessionStorage.getItem("colheita_token")).toBe("session");
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears the session and leaves the personal route on confirmation", async () => {
    signedIn();
    render(<SettingsView token="session" />);
    await userEvent.click(row(/^Sair/));
    await userEvent.click(screen.getByRole("button", { name: /Sair mesmo assim/ }));

    expect(sessionStorage.getItem("colheita_token")).toBeNull();
    expect(sessionStorage.getItem("colheita_user")).toBeNull();
    // Sem mandar embora, a pessoa ficaria olhando a tela de acesso dentro de
    // "Configurações".
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("changes the password with the two fields the server accepts", async () => {
    signedIn();
    const fetch = vi.fn<(url: string, options: RequestInit) => Promise<Response>>(
      async () => Response.json({ id: "1", updatedAt: "x" }),
    );
    vi.stubGlobal("fetch", fetch);
    render(<SettingsView token="session" />);
    await userEvent.click(row(/Trocar senha/));

    await userEvent.type(screen.getByLabelText("Senha atual"), "antiga123");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novasenha1");
    await userEvent.type(
      screen.getByLabelText("Repita a nova senha"),
      "novasenha1",
    );
    await userEvent.click(screen.getByRole("button", { name: "Trocar senha" }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/users\/me\/password$/);
    expect(options?.method).toBe("PATCH");
    // O ValidationPipe roda com forbidNonWhitelisted: um terceiro campo daria
    // 422, então a confirmação fica no cliente.
    expect(JSON.parse(String(options?.body))).toEqual({
      currentPassword: "antiga123",
      newPassword: "novasenha1",
    });
    // A troca derruba a sessão em todo aparelho, então a tela sai junto.
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("refuses a confirmation that does not match, without calling the API", async () => {
    signedIn();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<SettingsView token="session" />);
    await userEvent.click(row(/Trocar senha/));

    await userEvent.type(screen.getByLabelText("Senha atual"), "antiga123");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novasenha1");
    await userEvent.type(
      screen.getByLabelText("Repita a nova senha"),
      "outrasenha1",
    );
    await userEvent.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(
      await screen.findByText(/As duas senhas não são iguais/),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports a refused password change instead of pretending it worked", async () => {
    signedIn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 401 })),
    );
    render(<SettingsView token="session" />);
    await userEvent.click(row(/Trocar senha/));

    await userEvent.type(screen.getByLabelText("Senha atual"), "errada123");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novasenha1");
    await userEvent.type(
      screen.getByLabelText("Repita a nova senha"),
      "novasenha1",
    );
    await userEvent.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Credenciais/);
    expect(replace).not.toHaveBeenCalled();
  });
});
