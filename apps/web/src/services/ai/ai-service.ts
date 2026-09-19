import { request } from "@/lib/http/client";
import { readAiStream } from "./ai-stream";

export async function runAi(
  prompt: string,
  token: string,
  signal: AbortSignal,
  onDelta: (delta: string) => void,
) {
  const response = await request("/ai/runs/stream", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });
  return readAiStream(response, onDelta);
}
