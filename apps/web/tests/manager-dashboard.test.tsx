import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";
import type { UnitIndicators } from "@/schemas/organization";

const OPEN: UnitIndicators = {
  suppressed: false,
  headcount: 20,
  reach: 14,
  active: 10,
  frequency: 4.2,
  tightRatio: 0.375,
  averageMood: 3.5,
  previous: { tightRatio: 0.7, averageMood: 2.5 },
};

const SUPPRESSED: UnitIndicators = {
  suppressed: true,
  headcount: null,
  reach: null,
  active: null,
  frequency: null,
  tightRatio: null,
  averageMood: null,
  previous: null,
};

function stubApi(indicators: UnitIndicators) {
  sessionStorage.setItem("colheita_token", "session");
  sessionStorage.setItem(
    "colheita_user",
    JSON.stringify({
      id: "1",
      name: "Gestora",
      email: "gestora@empresa.com.br",
      role: "ADMIN",
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const { pathname } = new URL(String(url));
      if (pathname === "/organizations/current/indicators") {
        return new Response(JSON.stringify(indicators), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

afterEach(cleanup);

describe("ManagerDashboard", () => {
  it("shows the unit indicators once they arrive", async () => {
    stubApi(OPEN);
    render(<ManagerDashboard />);

    expect(await screen.findByText("38%")).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("shows no number at all when the unit is suppressed", async () => {
    stubApi(SUPPRESSED);
    const { container } = render(<ManagerDashboard />);

    expect(
      await screen.findByText(/Dados insuficientes para preservar o anonimato/),
    ).toBeInTheDocument();
    // O critério de aceite da issue #14: com a unidade suprimida nenhum
    // número chega à tela, nem o tamanho do grupo.
    expect(container.textContent).not.toMatch(/\d/);
  });

  it("never states how many people are missing", async () => {
    stubApi(SUPPRESSED);
    render(<ManagerDashboard />);

    await screen.findByText(/Dados insuficientes/);
    // Dizer "faltam 2 pessoas" entrega o tamanho do grupo pela porta de trás.
    expect(screen.queryByText(/\bfaltam\b|\bparticipantes\b/i)).toBeNull();
  });

  it("treats a single missing indicator as no data, not as zero", async () => {
    stubApi({ ...OPEN, tightRatio: null });
    render(<ManagerDashboard />);

    await screen.findByText("3.5");
    expect(screen.queryByText("0%")).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByText("Ainda não há dado suficiente."),
    ).toBeInTheDocument();
  });

  it("tells the manager the action is never individual", async () => {
    stubApi(OPEN);
    render(<ManagerDashboard />);

    await screen.findByText("38%");
    expect(
      screen.getByText(/Nunca convoque uma pessoa com base no uso do aplicativo/),
    ).toBeInTheDocument();
  });

  it("reports a failure instead of rendering an empty panel", async () => {
    stubApi(OPEN);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    render(<ManagerDashboard />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );
  });
});
