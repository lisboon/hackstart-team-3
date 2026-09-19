import assert from "node:assert/strict";
import test from "node:test";
import { readAiStream } from "../src/services/ai/ai-stream.ts";

function response(text, chunkSize = 1) {
  const bytes = new TextEncoder().encode(text);
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += chunkSize)
          controller.enqueue(bytes.slice(i, i + chunkSize));
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}

test("reassembles fragmented UTF-8 and CRLF events", async () => {
  const deltas = [];
  const result = await readAiStream(
    response(
      ': heartbeat\r\n\r\nevent: started\r\ndata: {"type":"started"}\r\n\r\n' +
        'data: {"type":"token","delta":"Olá 🌎"}\r\n\r\n' +
        'data: {"type":"completed","content":"Olá 🌎"}\r\n\r\n',
    ),
    (delta) => deltas.push(delta),
  );
  assert.equal(result, "Olá 🌎");
  assert.deepEqual(deltas, ["Olá 🌎"]);
});

test("reports an interrupted stream without completed", async () => {
  await assert.rejects(
    readAiStream(
      response('data: {"type":"token","delta":"partial"}\n\n'),
      () => {},
    ),
    /interrompida/,
  );
});

test("surfaces provider errors", async () => {
  await assert.rejects(
    readAiStream(
      response('data: {"type":"error","message":"timeout"}\n\n'),
      () => {},
    ),
    /timeout/,
  );
});

test("rejects malformed events and non-SSE responses", async () => {
  for (const body of [
    "data: invalid\n\n",
    "data: null\n\n",
    'data: {"type":"unknown"}\n\n',
  ]) {
    await assert.rejects(
      readAiStream(response(body), () => {}),
      /inválid/,
    );
  }
  await assert.rejects(
    readAiStream(new Response("unavailable", { status: 502 }), () => {}),
    /iniciar/,
  );
});
