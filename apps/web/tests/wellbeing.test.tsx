import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import { Workspace } from "@/components/auth/workspace";

const INVESTIGATION = /por que|porqu[eê]|motivo|explique|relate|conte o que/i;

const summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 8 / 3,
  previousAverage: 1 / 3,
  declaredMonths: 6,
};

function stubApi() {
  const fetch = vi.fn(async (url: string) =>
    String(url).includes("/auth/login")
      ? Response.json({ accessToken: "session" })
      : Response.json(summary),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

async function signIn() {
  render(<Workspace />);
  await userEvent.type(screen.getByLabelText("Senha"), "password");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  return screen.findByRole("heading", {
    level: 1,
    name: "Como você está hoje?",
  });
}

function supportPaths(overrides: Partial<Parameters<typeof SupportPaths>[0]>) {
  return render(
    <SupportPaths
      lessonSkipped={false}
      onSkipLesson={vi.fn()}
      onResumeLesson={vi.fn()}
      {...overrides}
    />,
  );
}

it("records the mood with a single tap", async () => {
  const onSelect = vi.fn();
  render(<MoodPrompt selected={null} onSelect={onSelect} />);
  const options = screen.getAllByRole("button");
  expect(options).toHaveLength(5);
  for (const option of options)
    expect(option).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(screen.getByRole("button", { name: "Muito difícil" }));
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("VERY_LOW");
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("walking the scale with the keyboard records nothing", async () => {
  const onSelect = vi.fn();
  render(<MoodPrompt selected={null} onSelect={onSelect} />);
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Mais ou menos" })).toHaveFocus();
  expect(onSelect).not.toHaveBeenCalled();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("NEUTRAL");
});

it("states the chosen level in words, not only in colour", () => {
  render(<MoodPrompt selected="LOW" onSelect={vi.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent("Hoje: Difícil");
  expect(screen.getByRole("button", { name: "Difícil" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("group").textContent).not.toMatch(INVESTIGATION);
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

it("moves focus to the welcome so it is not missed", async () => {
  supportPaths({});
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Hoje não precisa ser produtivo" }),
    ).toHaveFocus(),
  );
});

it("lets the person drop the lesson and take it back", async () => {
  const onSkipLesson = vi.fn();
  const onResumeLesson = vi.fn();
  const { unmount } = supportPaths({ onSkipLesson });
  await userEvent.click(screen.getByRole("button", { name: /Pular a lição/ }));
  expect(onSkipLesson).toHaveBeenCalledOnce();
  unmount();
  supportPaths({ lessonSkipped: true, onResumeLesson });
  expect(screen.getByText("Combinado: hoje sem lição.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Pular a lição/ })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Mudei de ideia" }));
  expect(onResumeLesson).toHaveBeenCalledOnce();
});

it("asks for the mood before any content", async () => {
  stubApi();
  await signIn();
  expect(screen.queryByText("Seu mês")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Bem" }));
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(screen.queryByText("Hoje não precisa ser produtivo")).toBeNull();
});

it("welcomes suffering and still shows the person her own content", async () => {
  stubApi();
  await signIn();
  await userEvent.click(screen.getByRole("button", { name: "Muito difícil" }));
  expect(
    await screen.findByText("Hoje não precisa ser produtivo"),
  ).toBeInTheDocument();
  expect(await screen.findByText("Seu mês")).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(INVESTIGATION);
});

it("sends the mood nowhere while there is no published contract", async () => {
  const fetch = stubApi();
  await signIn();
  await userEvent.click(screen.getByRole("button", { name: "Muito difícil" }));
  await screen.findByText("Seu mês");
  const paths = fetch.mock.calls.map(([url]) => new URL(String(url)).pathname);
  expect(paths).toEqual(["/auth/login", "/me/summary"]);
});

it("forgets the mood and the skipped lesson when the person leaves", async () => {
  stubApi();
  await signIn();
  await userEvent.click(screen.getByRole("button", { name: "Muito difícil" }));
  await userEvent.click(screen.getByRole("button", { name: /Pular a lição/ }));
  expect(screen.getByText("Combinado: hoje sem lição.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sair" }));
  await userEvent.type(screen.getByLabelText("Senha"), "password");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Como você está hoje?",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Seu mês")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Muito difícil" }));
  expect(
    await screen.findByRole("button", { name: /Pular a lição/ }),
  ).toBeInTheDocument();
});
