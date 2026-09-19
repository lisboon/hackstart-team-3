import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useAiRun } from "@/hooks/ai/use-ai-run";
import { runAi } from "@/services/ai/ai-service";
import { HttpError } from "@/lib/http/client";

vi.mock("@/services/ai/ai-service", () => ({ runAi: vi.fn() }));

it("streams and completes without duplicating final content", async () => {
  vi.mocked(runAi).mockImplementationOnce(
    async (_prompt, _token, _signal, onDelta) => {
      onDelta("partial");
      return "complete";
    },
  );
  const { result } = renderHook(() => useAiRun("token", vi.fn()));
  await act(() => result.current.run("question"));
  expect(result.current.answer).toBe("complete");
  expect(result.current.status).toBe("Execução concluída");
  expect(result.current.pending).toBe(false);
});
it("retains partial content on interruption and permits retry", async () => {
  vi.mocked(runAi)
    .mockImplementationOnce(async (_p, _t, _s, delta) => {
      delta("partial");
      throw new Error("Interrompida");
    })
    .mockResolvedValueOnce("recovered");
  const { result } = renderHook(() => useAiRun("token", vi.fn()));
  await act(() => result.current.run("question"));
  expect(result.current.answer).toBe("partial");
  expect(result.current.status).toBe("Interrompida");
  await act(() => result.current.run("retry"));
  expect(result.current.answer).toBe("recovered");
});
it("ends session on 401 but keeps it on 403", async () => {
  const unauthorized = vi.fn();
  const { result } = renderHook(() => useAiRun("token", unauthorized));
  vi.mocked(runAi).mockRejectedValueOnce(new HttpError(403));
  await act(() => result.current.run("question"));
  expect(unauthorized).not.toHaveBeenCalled();
  expect(result.current.status).toMatch(/permissão/);
  vi.mocked(runAi).mockRejectedValueOnce(new HttpError(401));
  await act(() => result.current.run("question"));
  expect(unauthorized).toHaveBeenCalledTimes(1);
});
it("cancels, prevents duplicate execution and ignores stale callbacks", async () => {
  let resolve!: (value: string) => void;
  let lateDelta!: (value: string) => void;
  let signal!: AbortSignal;
  const calls = vi.mocked(runAi).mock.calls.length;
  vi.mocked(runAi).mockImplementationOnce((_p, _t, s, delta) => {
    signal = s;
    lateDelta = delta;
    return new Promise((done) => {
      resolve = done;
    });
  });
  const { result } = renderHook(() => useAiRun("token", vi.fn()));
  let old!: Promise<void>;
  act(() => {
    old = result.current.run("old");
    void result.current.run("duplicate");
  });
  expect(vi.mocked(runAi).mock.calls.length - calls).toBe(1);
  act(() => result.current.cancel());
  expect(signal.aborted).toBe(true);
  expect(result.current.status).toBe("Execução cancelada");
  vi.mocked(runAi).mockResolvedValueOnce("new");
  await act(() => result.current.run("new"));
  await act(async () => {
    lateDelta("old delta");
    resolve("old");
    await old;
  });
  expect(result.current.answer).toBe("new");
});
it("aborts active stream on unmount", () => {
  let signal!: AbortSignal;
  vi.mocked(runAi).mockImplementationOnce((_p, _t, s) => {
    signal = s;
    return new Promise(() => {});
  });
  const { result, unmount } = renderHook(() => useAiRun("token", vi.fn()));
  act(() => {
    void result.current.run("question");
  });
  unmount();
  expect(signal.aborted).toBe(true);
});
