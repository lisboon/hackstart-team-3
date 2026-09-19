import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { usePersonalSummary } from "@/hooks/financial-health/use-personal-summary";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import {
  averageWidth,
  compareTrajectory,
  describeAverage,
  formatMonth,
} from "@/components/financial-health/summary-presentation";
import type { PersonalSummary as Summary } from "@/schemas/financial-health";

const summary: Summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 2.67,
  previousAverage: 0.33,
  declaredMonths: 6,
};

function respondWith(payload: unknown) {
  const fetch = vi.fn(async () => Response.json(payload));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function renderScreen(onUnauthorized = vi.fn()) {
  return render(
    <PersonalSummary token="session" onUnauthorized={onUnauthorized} />,
  );
}

it("only compares when both averages are numbers", () => {
  expect(compareTrajectory({ recentAverage: null, previousAverage: 1 })).toBeNull();
  expect(compareTrajectory({ recentAverage: 1, previousAverage: null })).toBeNull();
  expect(compareTrajectory({ recentAverage: null, previousAverage: null })).toBeNull();
  expect(compareTrajectory({ recentAverage: 0, previousAverage: 0 })).toBe("steady");
  expect(compareTrajectory({ recentAverage: 2.67, previousAverage: 0.33 })).toBe("lighter");
  expect(compareTrajectory({ recentAverage: 0.33, previousAverage: 2.67 })).toBe("tighter");
  expect(compareTrajectory({ recentAverage: 2, previousAverage: 1.6 })).toBe("steady");
});

it("describes the month in UTC and the average without the scale", () => {
  expect(formatMonth("2026-09-01T00:00:00.000Z")).toBe("Setembro de 2026");
  expect(formatMonth("2026-01-01T00:00:00.000Z")).toBe("Janeiro de 2026");
  expect(describeAverage(3)).toMatch(/sobra/);
  expect(describeAverage(2)).toMatch(/limite/);
  expect(describeAverage(1)).toMatch(/pouca falta/);
  expect(describeAverage(0)).toMatch(/bastante falta/);
  expect(averageWidth(3)).toBe("100%");
  expect(averageWidth(0)).toBe("0%");
  expect(averageWidth(-1)).toBe("0%");
  expect(averageWidth(9)).toBe("100%");
});

it("loads the person's own summary", async () => {
  respondWith(summary);
  const { result } = renderHook(() => usePersonalSummary("session", vi.fn()));
  await waitFor(() => expect(result.current.summary).toEqual(summary));
  expect(result.current.error).toBe("");
  expect(result.current.loading).toBe(false);
});

it("returns to the access screen when the session expires", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 401 })),
  );
  const onUnauthorized = vi.fn();
  const { result } = renderHook(() =>
    usePersonalSummary("session", onUnauthorized),
  );
  await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  expect(result.current.summary).toBeNull();
  expect(result.current.error).toBe("");
});

it("declares the month with only the situation and reloads the trajectory", async () => {
  let declared = "SURPLUS";
  const fetch = vi.fn(async (_url: string, options: RequestInit) => {
    if (String(_url).includes("/me/self-report")) {
      declared = JSON.parse(String(options.body)).situation;
      return Response.json({
        referenceMonth: summary.currentMonth,
        situation: declared,
      });
    }
    return Response.json({ ...summary, currentSituation: declared });
  });
  vi.stubGlobal("fetch", fetch);
  const { result } = renderHook(() => usePersonalSummary("session", vi.fn()));
  await waitFor(() => expect(result.current.summary).not.toBeNull());
  let accepted = false;
  await act(async () => {
    accepted = await result.current.declare("BREAK_EVEN");
  });
  expect(accepted).toBe(true);
  const [url, options] =
    fetch.mock.calls.find(([called]) =>
      String(called).includes("/me/self-report"),
    ) ?? [];
  expect(url).toMatch(/\/me\/self-report$/);
  expect(options?.method).toBe("POST");
  expect(JSON.parse(String(options?.body))).toEqual({ situation: "BREAK_EVEN" });
  await waitFor(() =>
    expect(result.current.summary?.currentSituation).toBe("BREAK_EVEN"),
  );
});

it("aborts the in-flight summary on unmount", () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal ?? undefined;
      return new Promise<Response>(() => {});
    }),
  );
  const { unmount } = renderHook(() => usePersonalSummary("session", vi.fn()));
  unmount();
  expect(signal?.aborted).toBe(true);
});

it("shows the declared month and the trajectory without exposing the scale", async () => {
  respondWith(summary);
  const { container } = renderScreen();
  expect(await screen.findByRole("heading", { level: 2 })).toHaveTextContent(
    "Setembro de 2026",
  );
  expect(screen.getByText("Sobrou")).toBeInTheDocument();
  expect(screen.getByText(/mais folgados/)).toBeInTheDocument();
  expect(screen.getByText(/Últimos três meses/)).toBeInTheDocument();
  expect(screen.getByText(/Três meses anteriores/)).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/\d+[.,]\d+/);
});

it("invites the declaration without treating absence as the worst month", async () => {
  respondWith({
    ...summary,
    currentSituation: null,
    recentAverage: null,
    previousAverage: null,
    declaredMonths: 0,
  });
  renderScreen();
  expect(await screen.findByText(/ainda não contou/)).toBeInTheDocument();
  expect(screen.getAllByRole("radio")).toHaveLength(4);
  expect(screen.queryByText("Sua trajetória")).toBeNull();
  expect(screen.getByText(/trajetória aparece aqui/)).toBeInTheDocument();
  expect(screen.queryByText(/mais folgados|mais apertados|seguiram parecidos/)).toBeNull();
});

it("hides the comparison while there is no previous quarter", async () => {
  respondWith({ ...summary, previousAverage: null, declaredMonths: 3 });
  renderScreen();
  expect(await screen.findByText(/Últimos três meses/)).toBeInTheDocument();
  expect(screen.queryByText(/Três meses anteriores/)).toBeNull();
  expect(screen.queryByText(/mais folgados|mais apertados|seguiram parecidos/)).toBeNull();
  expect(screen.getByText(/mais um trimestre declarado/)).toBeInTheDocument();
});

it("corrects the declaration of the month already declared", async () => {
  let declared = "SURPLUS";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      if (String(url).includes("/me/self-report")) {
        declared = JSON.parse(String(options.body)).situation;
        return Response.json({
          referenceMonth: summary.currentMonth,
          situation: declared,
        });
      }
      return Response.json({ ...summary, currentSituation: declared });
    }),
  );
  renderScreen();
  await userEvent.click(await screen.findByRole("button", { name: /Corrigir/ }));
  await userEvent.click(screen.getByRole("radio", { name: /Faltou um pouco/ }));
  await userEvent.click(
    screen.getByRole("button", { name: /Corrigir declaração/ }),
  );
  expect(await screen.findByText("Faltou um pouco")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByRole("radio")).toBeNull(),
  );
});

it("reports a failed load and allows retrying", async () => {
  const fetch = vi.fn(async () => new Response("", { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  renderScreen();
  expect(await screen.findByRole("alert")).toHaveTextContent(/indisponível/);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(summary)),
  );
  await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
  expect(await screen.findByText("Sobrou")).toBeInTheDocument();
});
