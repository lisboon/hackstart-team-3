import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/layout/toaster";
import { toast } from "@/lib/toast";
import { useDailyMood } from "@/hooks/wellbeing/use-daily-mood";

beforeEach(() => toast.dismissAll());
afterEach(() => toast.dismissAll());

describe("a pilha de avisos", () => {
  it("mostra o que foi empurrado e deixa fechar", async () => {
    render(<Toaster />);
    act(() => {
      toast.success("Humor registrado", "Obrigado por contar como você está.");
    });

    expect(await screen.findByText("Humor registrado")).toBeInTheDocument();
    expect(
      screen.getByText("Obrigado por contar como você está."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByText("Humor registrado")).toBeNull();
  });

  it("anuncia erro como alerta e o resto como estado", async () => {
    render(<Toaster />);
    act(() => {
      toast.error("Não foi possível entrar");
      toast.success("Humor registrado");
    });

    // Quem usa leitor de tela precisa ser interrompido quando a ação falhou, e
    // não quando ela deu certo.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível entrar",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Humor registrado");
  });

  it("renova o aviso repetido em vez de empilhar cópias", async () => {
    render(<Toaster />);
    act(() => {
      toast.info("Você já respondeu hoje");
      toast.info("Você já respondeu hoje");
      toast.info("Você já respondeu hoje");
    });

    // Três toques na mesma carinha aconteceram uma vez só, do ponto de vista de
    // quem lê a tela.
    expect(screen.getAllByText("Você já respondeu hoje")).toHaveLength(1);
  });

  it("dispensa sozinho sem deixar temporizador para trás", async () => {
    vi.useFakeTimers();
    try {
      render(<Toaster />);
      act(() => {
        toast.success("Humor registrado");
      });
      expect(screen.getByText("Humor registrado")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByText("Humor registrado")).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("nao desenha nada quando a fila esta vazia", () => {
    const { container } = render(<Toaster />);
    expect(container.querySelectorAll("[role]")).toHaveLength(0);
  });
});

function stubToday(status: number) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname } = new URL(String(url));
    if (init?.method === "POST" && pathname === "/me/today/mood")
      return status === 201
        ? Response.json(
            { entryDate: "2026-09-20T00:00:00.000Z", mood: 4, note: null },
            { status },
          )
        : new Response("{}", { status });
    if (pathname === "/me/today")
      return Response.json({
        entryDate: "2026-09-20",
        answered: false,
        mood: null,
        piece: null,
      });
    return new Response("{}", { status: 404 });
  });
}

describe("os dois silêncios que existiam", () => {
  it("avisa que o dia já foi respondido em vez de recarregar calado", async () => {
    vi.stubGlobal("fetch", stubToday(409));
    render(<Toaster />);
    const { result } = renderHook(() =>
      useDailyMood("session", () => undefined),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.record(3));

    expect(await screen.findByText("Você já respondeu hoje")).toBeInTheDocument();
  });

  it("confirma o humor registrado", async () => {
    vi.stubGlobal("fetch", stubToday(201));
    render(<Toaster />);
    const { result } = renderHook(() =>
      useDailyMood("session", () => undefined),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.record(4));

    expect(await screen.findByText("Humor registrado")).toBeInTheDocument();
  });
});
