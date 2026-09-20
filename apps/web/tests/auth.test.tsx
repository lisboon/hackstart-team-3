import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/auth/use-auth";

const credentials = { email: "person@example.test", password: "password" };

it("authenticates then clears the in-memory session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ 
      accessToken: "session",
      user: { id: "1", name: "Test User", email: "test@example.com", role: "USER" }
    })),
  );
  const { result } = renderHook(() => useAuth());
  await act(() => result.current.signIn(credentials));
  expect(result.current.token).toBe("session");
  act(() => result.current.logout());
  expect(result.current.token).toBe("");
  expect(result.current.error).toBe("");
});
it("handles refusal and invalid session responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(Response.json({ accessToken: "" })),
  );
  const { result } = renderHook(() => useAuth());
  await act(() => result.current.signIn(credentials));
  expect(result.current.error).toMatch(/Credenciais/);
  await act(() => result.current.signIn(credentials));
  expect(result.current.error).toMatch(/sessão inválida/);
  expect(result.current.token).toBe("");
});
it("blocks concurrent login and ignores a late response after logout", async () => {
  let resolve!: (response: Response) => void;
  let signal!: AbortSignal;
  const fetch = vi.fn((_url, options) => {
    signal = options.signal;
    return new Promise<Response>((done) => {
      resolve = done;
    });
  });
  vi.stubGlobal("fetch", fetch);
  const { result } = renderHook(() => useAuth());
  let task!: Promise<void>;
  act(() => {
    task = result.current.signIn(credentials);
    void result.current.signIn(credentials);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  act(() => result.current.logout());
  expect(signal.aborted).toBe(true);
  await act(async () => {
    resolve(Response.json({ 
      accessToken: "late",
      user: { id: "1", name: "Test User", email: "test@example.com", role: "USER" }
    }));
    await task;
  });
  expect(result.current.token).toBe("");
});
it("aborts authentication on unmount", () => {
  let signal!: AbortSignal;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    }),
  );
  const { result, unmount } = renderHook(() => useAuth());
  act(() => {
    void result.current.signIn(credentials);
  });
  unmount();
  expect(signal.aborted).toBe(true);
});

it("shares one session across trees that do not know each other", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        accessToken: "session",
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: "USER",
        },
      }),
    ),
  );
  // A TabBar mora na moldura e o "Sair" mora em Configurações, três níveis
  // abaixo. Com estado por componente, sair numa árvore deixaria a outra acesa.
  const gate = renderHook(() => useAuth());
  const bar = renderHook(() => useAuth());
  await act(() => gate.result.current.signIn(credentials));
  expect(bar.result.current.token).toBe("session");
  expect(bar.result.current.user?.name).toBe("Test User");
  act(() => gate.result.current.logout());
  expect(bar.result.current.token).toBe("");
  expect(bar.result.current.user).toBeNull();
});

it("reports the session as hydrated only after mounting", () => {
  // A barra de navegação depende disto para não piscar cinco destinos antes de
  // saber se há sessão.
  const { result } = renderHook(() => useAuth());
  expect(result.current.isInitialized).toBe(true);
});

it("signs in even when the browser refuses to store the session", async () => {
  // Aba privada do Safari, politica da empresa, cota estourada. Com o storage
  // como unica fonte, a escrita morria no catch e a pessoa ficava na tela de
  // entrada sem sessao e sem erro — o pior desfecho possivel, porque nao ha o
  // que tentar de novo.
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        accessToken: "session",
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: "USER",
        },
      }),
    ),
  );

  const { result } = renderHook(() => useAuth());
  await act(() => result.current.signIn(credentials));

  expect(result.current.token).toBe("session");
  expect(result.current.user?.name).toBe("Test User");
  expect(result.current.error).toBe("");

  // E sair continua saindo: sem isto a sessao em memoria sobreviveria ao
  // logout e vazaria para o proximo teste, que o setup so limpa o storage.
  act(() => result.current.logout());
  expect(result.current.token).toBe("");
  expect(result.current.user).toBeNull();
});

it("keeps storage as the source once the browser accepts it again", async () => {
  // A bandeira de "so memoria" vale para a tentativa mais recente. Se ficasse
  // presa, a sessao de um login anterior venceria o que esta no storage.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        accessToken: "session",
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: "USER",
        },
      }),
    ),
  );
  const { result } = renderHook(() => useAuth());
  await act(() => result.current.signIn(credentials));

  expect(sessionStorage.getItem("colheita_token")).toBe("session");
  sessionStorage.clear();
  act(() => result.current.logout());
  expect(result.current.token).toBe("");
});
