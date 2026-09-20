import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import { Workspace } from "@/components/auth/workspace";

const INVESTIGATION = /por que|porqu[eê]|motivo|explique|relate|conte o que/i;
const ENTRY_DATE = "2026-09-19T00:00:00.000Z";
const WELCOME = "Hoje não precisa ser produtivo";

const summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 8 / 3,
  previousAverage: 1 / 3,
  declaredMonths: 6,
};

// A janela aberta e o caso normal destes testes, que sao sobre humor e
// colheita. O caso fechado tem o seu arquivo: tests/journey-window.test.tsx.
const OPEN_WINDOW = {
  open: true,
  opensAt: "2026-09-21T11:30:00.000Z",
  closesAt: "2026-09-21T22:00:00.000Z",
};

function stubApi({
  answered = false,
  mood = null as number | null,
  moodStatus = 201,
  piece = null as object | null,
  window = OPEN_WINDOW,
}) {
  const day = {
    entryDate: ENTRY_DATE,
    answered,
    mood,
    note: null as string | null,
    pieceAnswered: false,
    piece,
    window,
  };
  const fetch = vi.fn(async (url: string, options: RequestInit = {}) => {
    const { pathname } = new URL(String(url));
    if (pathname === "/auth/login")
      return Response.json({
        accessToken: "session",
        user: { id: "1", name: "Test User", email: "test@test.com", role: "USER" },
      });
    if (pathname === "/me/today") return Response.json({ ...day });
    if (pathname === "/me/today/mood") {
      const body = JSON.parse(String(options.body));
      const requested = body.mood as number;
      day.answered = true;
      day.mood = moodStatus === 409 ? 1 : requested;
      day.note = typeof body.note === "string" ? body.note : null;
      if (moodStatus === 409) return new Response("", { status: 409 });
      return Response.json(
        { entryDate: ENTRY_DATE, mood: requested, note: day.note },
        { status: 201 },
      );
    }
    if (pathname === "/me/summary") return Response.json(summary);
    if (pathname === "/me/streak")
      return Response.json({
        currentStreak: 0,
        longestStreak: 0,
        week: Array.from({ length: 7 }, (_, i) => ({
          date: ENTRY_DATE,
          weekday: i,
          state: "future",
        })),
        freezesAvailable: 1,
        freezeApplied: false,
      });
    return new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

async function signIn() {
  render(<Workspace />);
  await userEvent.type(screen.getByLabelText("Senha"), "password");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

function supportPaths(overrides: Partial<Parameters<typeof SupportPaths>[0]>) {
  return render(<SupportPaths takeFocus={false} {...overrides} />);
}

it("opens a confirmation popup on tap instead of recording right away", async () => {
  const onConfirm = vi.fn();
  const { container } = render(
    <MoodPrompt pending={false} error="" onConfirm={onConfirm} />,
  );
  expect(screen.getAllByRole("button")).toHaveLength(5);
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Chuva" }));
  // O toque não registra: abre o <dialog> com a caixa opcional.
  expect(onConfirm).not.toHaveBeenCalled();
  const dialog = await screen.findByRole("dialog");
  expect(dialog.tagName).toBe("DIALOG");
  expect(dialog).toHaveAttribute("open");
  expect(screen.getByRole("textbox")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/[1-5]/);
});

it("registers with an optional note, and without one on 'Não responder'", async () => {
  const onConfirm = vi.fn();
  const { rerender } = render(
    <MoodPrompt pending={false} error="" onConfirm={onConfirm} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Sol" }));
  await userEvent.type(screen.getByRole("textbox"), "Aliviado hoje.");
  await userEvent.click(screen.getByRole("button", { name: "Registrar" }));
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith(5, "Aliviado hoje.");

  onConfirm.mockClear();
  rerender(<MoodPrompt pending={false} error="" onConfirm={onConfirm} />);
  await userEvent.click(screen.getByRole("button", { name: "Nublado" }));
  await userEvent.click(screen.getByRole("button", { name: "Não responder" }));
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith(3, undefined);
});

it("walking the scale with the keyboard records nothing", async () => {
  const onConfirm = vi.fn();
  render(<MoodPrompt pending={false} error="" onConfirm={onConfirm} />);
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Nublado" })).toHaveFocus();
  expect(onConfirm).not.toHaveBeenCalled();
  // Enter só abre o popup — ainda não registra.
  await userEvent.keyboard("{Enter}");
  expect(onConfirm).not.toHaveBeenCalled();
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
});

it("blocks the scale while it records and reports a failure", () => {
  render(<MoodPrompt pending error="" onConfirm={vi.fn()} />);
  for (const option of screen.getAllByRole("button"))
    expect(option).toBeDisabled();
  render(<MoodPrompt pending={false} error="Falhou" onConfirm={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
});

it("welcomes without investigating and lets the person choose", () => {
  const { container } = supportPaths({});
  expect(container.textContent).not.toMatch(INVESTIGATION);
  expect(screen.queryByRole("textbox")).toBeNull();
  const paths = screen.getAllByRole("listitem").map((item) => item.textContent);
  expect(paths).toHaveLength(5);
  expect(paths[0]).not.toMatch(/gestor/i);
  expect(paths.at(-1)).toMatch(/gestor/i);
  expect(screen.getByRole("link", { name: /188/ })).toHaveAttribute(
    "href",
    "tel:188",
  );
  expect(screen.getByText(/não faz diagnóstico/)).toBeInTheDocument();
});

it("shows the mood question at the top alongside the rest of the home", async () => {
  stubApi({ answered: false });
  await signIn();
  // A pergunta de humor abre a Home…
  expect(
    await screen.findByRole("heading", {
      name: "Como está o seu tempo hoje?",
    }),
  ).toBeInTheDocument();
  // …mas não fica sozinha: o resto da página (o resumo) aparece junto, mesmo
  // sem o humor do dia registrado.
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
});

it("sends the chosen level and opens the app", async () => {
  const fetch = stubApi({ answered: false });
  await signIn();
  await screen.findByRole("heading", { level: 1 });
  await userEvent.click(screen.getByRole("button", { name: "Sol entre nuvens" }));
  // O popup confirma antes de registrar: sem ele, nada é enviado.
  await userEvent.click(
    await screen.findByRole("button", { name: "Não responder" }),
  );
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  const post = fetch.mock.calls.find(([url]) =>
    String(url).endsWith("/me/today/mood"),
  );
  expect(post?.[1]?.method).toBe("POST");
  expect(JSON.parse(String(post?.[1]?.body))).toEqual({ mood: 4 });
  expect(
    screen.queryByRole("heading", { level: 1, name: "Como está o seu tempo hoje?" }),
  ).toBeNull();
});

it("keeps a page heading after the question leaves the screen", async () => {
  stubApi({ answered: true, mood: 4 });
  await signIn();
  await screen.findByText("Seu mês");
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});

it("does not put the welcome on the home anymore, even on the lowest levels", async () => {
  stubApi({ answered: true, mood: 1 });
  await signIn();
  // O acolhimento migrou para o Perfil: a Home não mostra mais o card, nem
  // mesmo no pior humor. O resto da Home segue.
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(screen.queryByText(WELCOME)).toBeNull();
  expect(document.body.textContent).not.toMatch(INVESTIGATION);
});

it("keeps the welcome away from a good day", async () => {
  stubApi({ answered: true, mood: 4 });
  await signIn();
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(screen.queryByText(WELCOME)).toBeNull();
});

it("records the mood on a tap and keeps the home, without a welcome", async () => {
  stubApi({ answered: false });
  await signIn();
  await screen.findByRole("heading", { level: 1 });
  await userEvent.click(screen.getByRole("button", { name: "Tempestade" }));
  await userEvent.click(
    await screen.findByRole("button", { name: "Não responder" }),
  );
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(screen.queryByText(WELCOME)).toBeNull();
});

it("leaves the home without a welcome on a day already answered", async () => {
  stubApi({ answered: true, mood: 1 });
  await signIn();
  await screen.findByText("Seu mês");
  expect(screen.queryByText(WELCOME)).toBeNull();
});

it("treats a day already answered as answered, not as an error", async () => {
  stubApi({ answered: false, moodStatus: 409 });
  await signIn();
  await screen.findByRole("heading", { level: 1 });
  await userEvent.click(screen.getByRole("button", { name: "Tempestade" }));
  await userEvent.click(
    await screen.findByRole("button", { name: "Não responder" }),
  );
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("records one answer even under a double tap", async () => {
  const fetch = stubApi({ answered: false });
  await signIn();
  await screen.findByRole("heading", { level: 1 });
  await userEvent.click(screen.getByRole("button", { name: "Sol" }));
  const confirm = await screen.findByRole("button", { name: "Não responder" });
  await Promise.all([userEvent.click(confirm), userEvent.click(confirm)]);
  await screen.findByText("Seu mês");
  const posts = fetch.mock.calls.filter(([url]) =>
    String(url).endsWith("/me/today/mood"),
  );
  expect(posts).toHaveLength(1);
});

it("refuses a level outside the contract instead of rendering it", async () => {
  stubApi({ answered: true, mood: 7 });
  await signIn();
  expect(await screen.findByRole("alert")).toHaveTextContent(/dia inválido/);
  expect(screen.queryByText("Seu mês")).toBeNull();
});

it("returns to the access screen when the session expires", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      String(url).includes("/auth/login")
        ? Response.json({ accessToken: "session" })
        : new Response("", { status: 401 }),
    ),
  );
  await signIn();
  expect(await screen.findByLabelText("Senha")).toBeInTheDocument();
});
