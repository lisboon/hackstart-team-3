export async function readAiStream(
  response: Response,
  onDelta: (delta: string) => void,
): Promise<string> {
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get("content-type")?.startsWith("text/event-stream")
  ) {
    throw new Error("Não foi possível iniciar a execução. Tente novamente.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        throw new Error("A resposta foi interrompida antes da conclusão.");
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const payload = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!payload) continue;
        let event: {
          type?: string;
          delta?: string;
          content?: string;
          message?: string;
        };
        try {
          event = JSON.parse(payload);
          if (!event || typeof event !== "object") throw new Error();
        } catch {
          throw new Error("O serviço retornou uma resposta inválida.");
        }
        if (event.type === "started") continue;
        if (event.type === "token" && typeof event.delta === "string") {
          onDelta(event.delta);
        } else if (
          event.type === "completed" &&
          typeof event.content === "string"
        ) {
          return event.content;
        } else if (event.type === "error") {
          throw new Error(event.message || "Falha na execução da IA.");
        } else {
          throw new Error("O serviço retornou um evento inválido.");
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
