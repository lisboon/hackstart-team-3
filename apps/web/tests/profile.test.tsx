import { renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useProfile } from "@/hooks/profile/use-profile";
import { ProfileView } from "@/components/profile/profile-view";
import { AchievementsView } from "@/components/profile/achievements-view";
import {
  currentStage,
  formatMemberSince,
  initials,
  profileStats,
} from "@/components/profile/profile-presentation";
import type { AuthUser } from "@/services/auth/auth-service";
import type { Track } from "@/schemas/track";

afterEach(cleanup);

const user: AuthUser = {
  id: "u1",
  name: "Ana Ferreira",
  email: "ana@x.test",
  role: "USER",
};
const account = {
  id: "u1",
  name: "Ana Ferreira",
  email: "ana@x.test",
  role: "USER" as const,
  companyId: "c1",
  active: true,
  createdAt: "2026-03-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
};
const organization = { id: "c1", name: "Unidade Centro", slug: "centro" };
const summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 2.67,
  previousAverage: 0.33,
  declaredMonths: 4,
};
const track: Track = {
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
  const payloads = { account, organization, summary, track, ...overrides };
  return vi.fn(async (url) => {
    const path = String(url);
    // `/auth/me` vem antes: é a única rota que traz `createdAt` e `avatarUrl`.
    if (path.includes("/auth/me")) return Response.json(payloads.account);
    if (path.includes("/organizations/current"))
      return Response.json(payloads.organization);
    if (path.includes("/me/track")) return Response.json(payloads.track);
    if (path.includes("/me/summary")) return Response.json(payloads.summary);
    throw new Error(`unexpected path ${path}`);
  });
}

it("abbreviates the name without turning a preposition into an initial", () => {
  expect(initials("Ana Ferreira")).toBe("AF");
  // "AD" não é a abreviação do nome de ninguém, e nome com preposição é a
  // regra no Brasil, não a exceção.
  expect(initials("Ana Paula de Souza")).toBe("AS");
  expect(initials("José dos Santos Lima")).toBe("JL");
  // "AA" para "Ana" parece defeito.
  expect(initials("Ana")).toBe("A");
  expect(initials("ana ferreira")).toBe("AF");
  expect(initials("  Érica  Nunes  ")).toBe("ÉN");
  expect(initials("   ")).toBe("?");
  expect(initials("de")).toBe("?");
});

it("keeps the join month by formatting in UTC", () => {
  // Formatar no fuso do Brasil jogaria 1/3 00:00Z para fevereiro.
  expect(formatMemberSince("2026-03-01T00:00:00.000Z")).toBe("Março de 2026");
  expect(formatMemberSince("2026-01-01T00:00:00.000Z")).toBe("Janeiro de 2026");
});

it("points at the first stage still open, and at none when there are none", () => {
  expect(currentStage(track)).toBe("ORGANIZAR");
  expect(
    currentStage({
      stages: track.stages.map((stage) => ({
        ...stage,
        answered: stage.total,
      })),
    }),
  ).toBeNull();
  // Trilha vazia não tem etapa atual: afirmar uma seria inventar.
  expect(currentStage({ stages: [] })).toBeNull();
});

it("derives four honest numbers and never a currency", () => {
  const stats = profileStats({
    account,
    summary: { declaredMonths: 4 },
    track,
  });
  expect(stats.map((stat) => stat.label)).toEqual([
    "Meses declarados",
    "Etapas concluídas",
    "Etapa atual",
    "Membro desde",
  ]);
  expect(stats.map((stat) => stat.value)).toEqual([
    "4",
    "2 de 5",
    "Organizar",
    "Março de 2026",
  ]);
  // O cliente recusou premiação: Sementes, Gotas d'água e Energia — que o
  // mockup de referência trazia — são moeda e mecânica de vidas.
  const labels = stats.map((stat) => stat.label).join(" ").toLowerCase();
  for (const forbidden of [
    "semente",
    "gota",
    "energia",
    "ponto",
    "moeda",
    "nível",
    "ofensiva",
  ]) {
    expect(labels).not.toContain(forbidden);
  }
});

it("does not call an empty track a finished one", () => {
  const stats = profileStats({
    account,
    summary: { declaredMonths: -3 },
    track: { stages: [] },
  });
  // Contagem negativa de um payload ruim não chega à tela.
  expect(stats[0].value).toBe("0");
  expect(stats[1].value).toBe("0 de 0");
  expect(stats[2].value).toBe("Ainda sem trilha");
});

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
  expect(screen.getByText("Etapa atual")).toBeInTheDocument();
  // `createdAt` só existe em GET /auth/me: sem essa leitura o perfil teria de
  // inventar desde quando a pessoa está aqui.
  expect(screen.getByText(/Membro desde Março de 2026/)).toBeInTheDocument();
  // Duas etapas de cinco, em texto — progresso não pode depender só da barra.
  expect(screen.getByText("2 de 5 etapas")).toBeInTheDocument();
});

it("puts settings behind the gear and keeps sign-out out of the profile", async () => {
  vi.stubGlobal("fetch", routedFetch());
  render(
    <ProfileView token="session" user={user} onUnauthorized={vi.fn()} />,
  );
  const gear = await screen.findByRole("link", { name: "Configurações" });
  expect(gear).toHaveAttribute("href", "/perfil/configuracoes");
  // Sair mora no fim de Configurações, não flutuando sobre o perfil.
  expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
});

it("opens with what was achieved and links to the full set of milestones", async () => {
  vi.stubGlobal("fetch", routedFetch());
  render(
    <ProfileView token="session" user={user} onUnauthorized={vi.fn()} />,
  );
  // Três marcos na prévia, oito no total: três de trajetória e cinco de trilha.
  const all = await screen.findByRole("link", { name: /Ver todas \(8\)/ });
  expect(all).toHaveAttribute("href", "/conquistas");
  expect(screen.getAllByText("Conquistado").length).toBeGreaterThan(0);
});

it("fills the preview with the achieved first and then what is closest", async () => {
  vi.stubGlobal(
    "fetch",
    routedFetch({
      summary: { ...summary, declaredMonths: 1 },
      track: {
        stages: [
          { stage: "CONSCIENTIZAR", total: 6, answered: 5 },
          { stage: "OBSERVAR", total: 6, answered: 0 },
          { stage: "ORGANIZAR", total: 6, answered: 0 },
          { stage: "PREPARAR", total: 6, answered: 0 },
          { stage: "SUSTENTAR", total: 6, answered: 0 },
        ],
      },
    }),
  );
  render(
    <ProfileView token="session" user={user} onUnauthorized={vi.fn()} />,
  );
  // Um mês declarado conquista o primeiro marco de trajetória.
  expect(
    await screen.findByText("Primeiro mês declarado"),
  ).toBeInTheDocument();
  // A etapa com 5 de 6 é a mais perto de vir, e entra antes das que estão em
  // zero — "falta pouco" é informação, "não veio" não é.
  expect(screen.getByText("Etapa Conscientizar")).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /Etapa Conscientizar: caminho já andado/ }),
  ).toBeInTheDocument();
  // Só três cabem na prévia; o resto vive na tela de Conquistas.
  const preview = screen.getByRole("heading", {
    name: "Conquistas da Colheita",
  }).parentElement?.parentElement;
  expect(preview?.querySelectorAll("li")).toHaveLength(3);
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
  // Troféus não conquistados ficam apagados/sépia, mas visíveis. O estado não
  // fica só na cor: vai no alt da imagem, para o leitor de tela (WCAG 1.4.1).
  const trophies = container.querySelectorAll("img");
  expect(trophies).toHaveLength(8);
  expect(
    Array.from(trophies).every((img) =>
      img.className.includes("sepia"),
    ),
  ).toBe(true);
  expect(
    Array.from(trophies).every((img) =>
      (img.getAttribute("alt") ?? "").includes("ainda não conquistado"),
    ),
  ).toBe(true);
  // A etiqueta de texto de status saiu da tela (fica só no alt).
  expect(screen.queryAllByText("Conquistado")).toHaveLength(0);
  expect(screen.queryAllByText("A caminho")).toHaveLength(0);
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
