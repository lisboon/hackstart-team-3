import assert from "node:assert/strict";
import test from "node:test";
import { journeySchema } from "../src/schemas/wellbeing.ts";

const SOURCE = "https://www.sicredi.com.br/site/napontadolapis/";

const node = (overrides) => ({
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

test("the journey accepts the three node states of the contract", () => {
  const parsed = journeySchema.parse({
    nodes: [
      node({
        id: "11111111-1111-4111-8111-111111111111",
        state: "answered",
        body: "Corpo",
        prompt: "Pergunta",
        answer: "Guardo",
        outcome: "Vira reserva.",
      }),
      node({
        id: "22222222-2222-4222-8222-222222222222",
        state: "current",
        body: "Corpo",
        prompt: "Pergunta",
        options: [{ label: "Guardo" }, { label: "Gasto" }],
      }),
      node({ id: "33333333-3333-4333-8333-333333333333", state: "locked" }),
    ],
  });
  assert.equal(parsed.nodes.length, 3);
  assert.equal(parsed.nodes[0].outcome, "Vira reserva.");
  assert.equal(parsed.nodes[1].options?.length, 2);
  assert.equal(parsed.nodes[2].body, null);
});

test("the journey rejects a node the screen cannot trust", () => {
  for (const invalid of [
    { nodes: [node({ state: "done" })] },
    { nodes: [node({ stage: "PLANEJAR" })] },
    { nodes: [node({ sourceUrl: "not-a-url" })] },
    { nodes: [node({ id: "not-a-uuid" })] },
    { nodes: [{ ...node(), title: "" }] },
  ])
    assert.equal(journeySchema.safeParse(invalid).success, false);
});

test("an empty trail is still a valid journey", () => {
  assert.deepEqual(journeySchema.parse({ nodes: [] }), { nodes: [] });
});
