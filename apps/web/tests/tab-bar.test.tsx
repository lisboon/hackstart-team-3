import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { TabBar } from "@/components/layout/tab-bar";
import { ICON_STROKE } from "@/components/ui/icon";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

function signedIn() {
  sessionStorage.setItem("colheita_token", "session");
  sessionStorage.setItem(
    "colheita_user",
    JSON.stringify({
      id: "1",
      name: "Pessoa",
      email: "pessoa@empresa.com.br",
      role: "USER",
    }),
  );
}

afterEach(() => {
  cleanup();
  pathname.current = "/";
});

describe("TabBar", () => {
  it("stays out of the way before login", () => {
    const { container } = render(<TabBar />);

    // Antes de entrar a tela tem uma tarefa só, e cinco destinos atrapalham.
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the five destinations once there is a session", async () => {
    signedIn();
    render(<TabBar />);

    for (const label of [
      "Hoje",
      "Progresso",
      "Trilha",
      "Conquistas",
      "Perfil",
    ]) {
      expect(await screen.findByRole("link", { name: label })).toBeVisible();
    }
  });

  it("marks the current destination for assistive technology", async () => {
    signedIn();
    pathname.current = "/trilha";
    render(<TabBar />);

    const trilha = await screen.findByRole("link", { name: "Trilha" });
    expect(trilha).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Hoje" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("puts the track under the thumb, raised and floating", async () => {
    signedIn();
    render(<TabBar />);

    const trilha = await screen.findByRole("link", { name: "Trilha" });
    const raised = trilha.querySelector(".animate-tab-float");
    expect(raised).not.toBeNull();
    // A flutuação é o único movimento contínuo do app: se sobrar em outro
    // destino, deixa de significar "é aqui".
    expect(
      screen
        .getByRole("link", { name: "Perfil" })
        .querySelector(".animate-tab-float"),
    ).toBeNull();
  });

  it("keeps every destination reachable by a real finger", async () => {
    signedIn();
    render(<TabBar />);

    // 44px é o mínimo de alvo tocável; min-h-11 são 2.75rem.
    for (const link of await screen.findAllByRole("link")) {
      expect(link.className).toMatch(/min-h-11/);
    }
  });

  it("names the bar so a screen reader can skip to it", async () => {
    signedIn();
    render(<TabBar />);

    expect(
      await screen.findByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
  });

  it("draws icons at the weight the Sicredi system uses", async () => {
    signedIn();
    const { container } = render(<TabBar />);

    await screen.findByRole("link", { name: "Hoje" });
    // O manual constroi sobre grid de 104px com traco de 6,5px: 6,25% do
    // tamanho. O padrao do lucide e 2 em viewBox 24, que da 8,33% e sai mais
    // pesado que o resto do sistema.
    const icons = container.querySelectorAll("svg[stroke-width]");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.getAttribute("stroke-width")).toBe(String(ICON_STROKE));
    }
  });
});
