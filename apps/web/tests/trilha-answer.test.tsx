import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// O mock cobre o modulo inteiro: um componente novo na arvore que chame
// `useRouter` quebraria aqui, longe de onde foi escrito.
vi.mock("next/navigation", () => ({
  usePathname: () => "/trilha",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import TrilhaPage from "@/app/trilha/page";

const SOURCE = "https://www.sicredi.com.br/site/napontadolapis/";

const node = (overrides: Record<string, unknown>) => ({
  id: "11111111-1111-4111-8111-111111111111",
  stage: "CONSCIENTIZAR",
  orderInStage: 1,
  title: "Uma peça",
  state: "locked",
  body: null,
  prompt: null,
  options: null,
  answer: null,
  outcome: null,
  sourceUrl: SOURCE,
  ...overrides,
});

/**
 * `answeredThenReload` faz `/me/journey` responder primeiro com o nó como
 * `current` e, depois da resposta, como `answered` — simulando a atualização
 * da colheita que o backend faria.
 */
function stubApi({ answeredThenReload = false } = {}) {
  let journeyCalls = 0;
  const currentNode = node({
    id: "22222222-2222-4222-8222-222222222222",
    stage: "OBSERVAR",
    title: "Para onde o dinheiro foi",
    state: "current",
    body: "Corpo da peça atual.",
    prompt: "Sobrou R$ 50. O que faz?",
    options: [{ label: "Guardo" }, { label: "Gasto" }],
  });

  const fetch = vi.fn(async (url: string) => {
    const { pathname } = new URL(String(url));
    if (pathname === "/auth/login")
      return Response.json({
        accessToken: "session",
        user: { id: "1", name: "T", email: "t@t.com", role: "USER" },
      });
    if (pathname === "/me/journey") {
      journeyCalls += 1;
      const answeredNow = answeredThenReload && journeyCalls > 1;
      return Response.json({
        nodes: [
          answeredNow
            ? { ...currentNode, state: "answered", answer: "Guardo", options: null, outcome: "Vira reserva." }
            : currentNode,
        ],
      });
    }
    if (pathname === "/me/today/answer") {
      return Response.json({
        outcome: "Vira reserva.",
        comprehended: true,
        sourceUrl: SOURCE,
      });
    }
    return new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
  return { fetch };
}

async function enterSession() {
  // A sessão vive no sessionStorage (ver useAuth). Semear o token evita o
  // formulário de login e deixa o teste focado na trilha.
  sessionStorage.setItem("colheita_token", "session");
  sessionStorage.setItem(
    "colheita_user",
    JSON.stringify({ id: "1", name: "T", email: "t@t.com", role: "USER" }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("Trilha — clicar na colheita atual", () => {
  it("abre a pergunta ao tocar na colheita de hoje", async () => {
    stubApi();
    enterSession();
    render(<TrilhaPage />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Para onde o dinheiro foi/,
      }),
    );

    // O campo de pergunta aparece com as opções da peça.
    expect(
      await screen.findByText("Sobrou R$ 50. O que faz?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardo" }),
    ).toBeInTheDocument();
  });

  it("atualiza a colheita depois de responder", async () => {
    stubApi({ answeredThenReload: true });
    enterSession();
    render(<TrilhaPage />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Para onde o dinheiro foi/,
      }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardo" }));

    // A consequência sobe na folha, e ao continuar a colheita está concluída.
    expect(await screen.findByText("Vira reserva.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Você escolheu" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Concluída/ }),
      ).toBeInTheDocument(),
    );
  });

  it("responde a colheita direto, sem o frontend registrar humor (backend abre o dia, #64)", async () => {
    // O frontend não faz mais contorno de humor: só chama /me/today/answer.
    const moodCalls: unknown[] = [];
    let answerCalls = 0;
    const fetch = vi.fn(async (url: string, options: RequestInit = {}) => {
      const { pathname } = new URL(String(url));
      if (pathname === "/me/journey")
        return Response.json({
          nodes: [
            node({
              id: "22222222-2222-4222-8222-222222222222",
              state: "current",
              title: "Para onde o dinheiro foi",
              body: "Corpo.",
              prompt: "Sobrou R$ 50. O que faz?",
              options: [{ label: "Guardo" }],
            }),
          ],
        });
      if (pathname === "/me/today/mood") {
        moodCalls.push(JSON.parse(String(options.body)));
        return Response.json({ entryDate: "2026-09-19T00:00:00.000Z", mood: 3 });
      }
      if (pathname === "/me/today/answer") {
        answerCalls += 1;
        return Response.json({
          outcome: "Vira reserva.",
          comprehended: true,
          sourceUrl: SOURCE,
        });
      }
      return new Response("", { status: 404 });
    });
    vi.stubGlobal("fetch", fetch);
    enterSession();

    render(<TrilhaPage />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Para onde o dinheiro foi/,
      }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardo" }));

    // A resposta funciona direto; o frontend não toca em /me/today/mood.
    expect(await screen.findByText("Vira reserva.")).toBeInTheDocument();
    expect(moodCalls).toHaveLength(0);
    expect(answerCalls).toBe(1);
  });
});
