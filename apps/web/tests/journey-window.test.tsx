import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { DailyJourney } from "@/components/journey/daily-journey";
import { WindowClosed } from "@/components/journey/window-closed";

const ENTRY_DATE = "2026-09-20T00:00:00.000Z";

function stubDay(open: boolean, opensAt: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const { pathname } = new URL(String(url));
      if (pathname === "/me/today")
        return Response.json({
          entryDate: ENTRY_DATE,
          answered: false,
          mood: null,
          note: null,
          pieceAnswered: false,
          piece: null,
          window: {
            open,
            opensAt,
            closesAt: "2026-09-21T22:00:00.000Z",
          },
        });
      return new Response("{}", { status: 404 });
    }),
  );
}

beforeEach(() => vi.useRealTimers());
afterEach(cleanup);

describe("a jornada fora do expediente", () => {
  it("mostra o horário no lugar da pergunta de humor", async () => {
    stubDay(false, "2026-09-21T11:30:00.000Z");
    render(<DailyJourney token="session" onUnauthorized={() => undefined} />);

    expect(
      await screen.findByText(/Sua próxima diária abre/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("não trata o horário como erro", async () => {
    stubDay(false, "2026-09-21T11:30:00.000Z");
    render(<DailyJourney token="session" onUnauthorized={() => undefined} />);

    await screen.findByText(/Sua próxima diária abre/);
    // Um `role="alert"` aqui diria que algo deu errado. Nada deu errado: o
    // produto está funcionando como projetado.
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mantém a trilha alcançável", async () => {
    stubDay(false, "2026-09-21T11:30:00.000Z");
    render(<DailyJourney token="session" onUnauthorized={() => undefined} />);

    const link = await screen.findByRole("link", { name: /rever a sua trilha/ });
    expect(link).toHaveAttribute("href", "/trilha");
  });

  it("volta a perguntar quando a janela abre", async () => {
    stubDay(true, "2026-09-21T11:30:00.000Z");
    render(<DailyJourney token="session" onUnauthorized={() => undefined} />);

    await waitFor(() =>
      expect(screen.queryByText(/Sua próxima diária abre/)).toBeNull(),
    );
  });
});

describe("como o cartão diz a hora", () => {
  const render_ = (opensAt: string) => {
    cleanup();
    render(<WindowClosed opensAt={opensAt} />);
  };

  it("diz o dia da semana quando é depois de amanhã", () => {
    // Sábado olhando para a segunda.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-19T15:00:00.000Z"));
    render_("2026-09-21T11:30:00.000Z");
    expect(screen.getByRole("heading")).toHaveTextContent(/segunda-feira/i);
    vi.useRealTimers();
  });

  it("diz \"amanhã\" quando é o dia seguinte", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-20T15:00:00.000Z"));
    render_("2026-09-21T11:30:00.000Z");
    expect(screen.getByRole("heading")).toHaveTextContent(/amanhã/i);
    vi.useRealTimers();
  });

  it("diz \"hoje\" quando ainda vai abrir no mesmo dia", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-21T09:00:00.000Z"));
    render_("2026-09-21T11:30:00.000Z");
    expect(screen.getByRole("heading")).toHaveTextContent(/hoje/i);
    vi.useRealTimers();
  });
});
