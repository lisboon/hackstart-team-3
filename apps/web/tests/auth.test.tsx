import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/auth/use-auth";

const credentials = { email: "person@example.test", password: "password" };

it("authenticates then clears the in-memory session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ accessToken: "session" })),
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
    resolve(Response.json({ accessToken: "late" }));
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
