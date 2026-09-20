import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { THEME_KEY } from "@/hooks/theme/use-theme";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark", "light");
});

describe("ThemeToggle", () => {
  it("is reachable and named", async () => {
    render(<ThemeToggle />);

    expect(
      await screen.findByRole("button", { name: /alternar tema/i }),
    ).toBeInTheDocument();
  });

  it("paints the document and remembers the choice", async () => {
    render(<ThemeToggle />);
    const toggle = await screen.findByRole("button", { name: /alternar tema/i });

    await userEvent.click(toggle);

    const root = document.documentElement;
    const chosen = root.classList.contains("dark") ? "dark" : "light";
    // As duas classes sao explicitas: a ausencia significa "siga o sistema",
    // e quem escolhe claro no sistema escuro precisa vencer a media query.
    expect(root.classList.contains(chosen)).toBe(true);
    expect(localStorage.getItem(THEME_KEY)).toBe(chosen);
  });

  it("stays a 44px target", async () => {
    render(<ThemeToggle />);

    // Mesmo mínimo tocável das abas: o botão fica num canto, que é onde o
    // polegar erra mais.
    const toggle = await screen.findByRole("button", { name: /alternar tema/i });
    expect(toggle.className).toMatch(/size-11/);
  });
});
