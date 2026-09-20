import { renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useProfile } from "@/hooks/profile/use-profile";
import { ProfileView } from "@/components/profile/profile-view";
import { AchievementsView } from "@/components/profile/achievements-view";
import type { AuthUser } from "@/services/auth/auth-service";

afterEach(cleanup);

const user: AuthUser = {
  id: "u1",
  name: "Ana Ferreira",
  email: "ana@x.test",
  role: "USER",
};
const organization = { id: "c1", name: "Unidade Centro", slug: "centro" };
const summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 2.67,
  previousAverage: 0.33,
  declaredMonths: 4,
};
const track = {
  stages: [
    { stage: "CONSCIENTIZAR", total: 6, answered: 6 },
    { stage: "OBSERVAR", total: 6, answered: 6 },
    { stage: "ORGANIZAR", total: 6, answered: 3 },
    { stage: "PREPARAR", total: 6, answered: 0 },
    { stage: "SUSTENTAR", total: 6, answered: 0 },
  ],
};

/** Roteia cada rota do perfil para o seu payload. */
function routedFetch(overrides = {}) {
  const payloads = { organization, summary, track, ...overrides };
  return vi.fn(async (url) => {
    const path = String(url);
    if (path.includes("/organizations/current"))
      return Response.json(payloads.organization);
    if (path.includes("/me/track")) return Response.json(payloads.track);
    if (path.includes("/me/summary")) return Response.json(payloads.summary);
    throw new Error(`unexpected path ${path}`);
  });
}

it("loads the person's own unit, track and summary", async () => {
  vi.stubGlobal("fetch", routedFetch());
  const { result } = renderHook(() => useProfile("session", vi.fn()));
  await waitFor(() => expect(result.current.data).not.toBeNull());
  expect(result.current.data?.organization.name).toBe("Unidade Centro");
  expect(result.current.data?.track.stages).toHaveLength(5);
  expect(result.current.error).toBe("");
});

it("returns to the access screen when the session expires", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 401 })),
  );
  const onUnauthorized = vi.fn();
  const { result } = renderHook(() => useProfile("session", onUnauthorized));
  await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  expect(result.current.data).toBeNull();
  expect(result.current.error).toBe("");
});

it("aborts the in-flight profile on unmount", () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url, options: RequestInit) => {
      signal = options.signal ?? undefined;
      return new Promise(() => {});
    }),
  );
  const { unmount } = renderHook(() => useProfile("session", vi.fn()));
  unmount();
  expect(signal?.aborted).toBe(true);
});

it("shows the name from the session, the unit and the person's own numbers", async () => {
  vi.stubGlobal("fetch", routedFetch());
  render(
    <ProfileView token="session" user={user} onUnauthorized={vi.fn()} />,
  );
  expect(
    await screen.findByRole("heading", { name: "Ana Ferreira" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Unidade Centro")).toBeInTheDocument();
  expect(screen.getByText("Etapas concluídas")).toBeInTheDocument();
  expect(screen.getByText("Meses declarados")).toBeInTheDocument();
  // Two completed stages of five, described in the ring's accessible label.
  const ring = screen.getByRole("img");
  expect(ring).toHaveAttribute("aria-label", expect.stringMatching(/2 de 5/));
});

it("reports a failed load and allows retrying", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 503 })),
  );
  render(
    <ProfileView token="session" user={user} onUnauthorized={vi.fn()} />,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(/indisponível/);
  vi.stubGlobal("fetch", routedFetch());
  await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
  expect(await screen.findByText("Unidade Centro")).toBeInTheDocument();
});

it("shows locked milestones dimmed instead of hiding them", async () => {
  vi.stubGlobal(
    "fetch",
    routedFetch({
      summary: { ...summary, declaredMonths: 0 },
      track: {
        stages: track.stages.map((stage) => ({ ...stage, answered: 0 })),
      },
    }),
  );
  const { container } = render(
    <AchievementsView token="session" onUnauthorized={vi.fn()} />,
  );
  // All eight milestones render even with nothing achieved.
  await waitFor(() => expect(container.querySelectorAll("li")).toHaveLength(8));
  const items = container.querySelectorAll("li");
  // Locked milestones are visible but dimmed, and every one says "A caminho".
  expect(
    Array.from(items).every((li) => li.className.includes("opacity-60")),
  ).toBe(true);
  expect(screen.getAllByText("A caminho")).toHaveLength(8);
  expect(screen.queryAllByText("Conquistado")).toHaveLength(0);
});

it("never compares the person with anyone else on the achievements screen", async () => {
  vi.stubGlobal("fetch", routedFetch());
  const { container } = render(
    <AchievementsView token="session" onUnauthorized={vi.fn()} />,
  );
  await waitFor(() =>
    expect(container.querySelectorAll("li").length).toBeGreaterThan(0),
  );
  expect(container.textContent).not.toMatch(
    /m[ée]dia|ranking|melhor que|pior que|acima da|abaixo da|placar|errado|\bnota\b/i,
  );
});

it("surfaces an error instead of trusting an invalid track payload", async () => {
  // A malformed /me/track (negative counts, missing stages array) must not slip
  // through to the screen: the schema rejects it and the hook reports an error.
  vi.stubGlobal(
    "fetch",
    routedFetch({ track: { stages: [{ stage: "CONSCIENTIZAR", total: -1 }] } }),
  );
  const { result } = renderHook(() => useProfile("session", vi.fn()));
  await waitFor(() => expect(result.current.error).not.toBe(""));
  expect(result.current.data).toBeNull();
  expect(result.current.error).toMatch(/trilha inválida/);
});
