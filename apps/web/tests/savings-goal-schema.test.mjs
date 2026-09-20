import assert from "node:assert/strict";
import test from "node:test";
import {
  createdGoalSchema,
  goalsSchema,
} from "../src/schemas/savings-goal.ts";

const goal = (overrides) => ({
  id: "11111111-1111-4111-8111-111111111111",
  kind: "MONTHLY",
  status: "ACTIVE",
  startMonth: "2026-09-01T00:00:00.000Z",
  targetMonths: 1,
  monthsMet: 0,
  currentMonthMet: false,
  termEndedUnmet: false,
  ...overrides,
});

test("aceita metas mensal e duradoura com progresso derivado", () => {
  const parsed = goalsSchema.parse({
    goals: [
      goal({ status: "MET", monthsMet: 1, currentMonthMet: true }),
      goal({
        id: "22222222-2222-4222-8222-222222222222",
        kind: "ENDURING",
        targetMonths: 6,
        monthsMet: 2,
      }),
    ],
  });
  assert.equal(parsed.goals.length, 2);
  assert.equal(parsed.goals[1].targetMonths, 6);
});

test("nunca há campo de valor em dinheiro no contrato", () => {
  const parsed = goalsSchema.parse({ goals: [goal({})] });
  const keys = Object.keys(parsed.goals[0]);
  for (const forbidden of ["amount", "value", "money", "reais", "balance"]) {
    assert.ok(!keys.includes(forbidden), `campo proibido: ${forbidden}`);
  }
});

test("rejeita o que a tela não pode confiar", () => {
  for (const invalid of [
    { goals: [goal({ kind: "WEEKLY" })] },
    { goals: [goal({ status: "PAUSED" })] },
    { goals: [goal({ id: "nope" })] },
    { goals: [goal({ targetMonths: 0 })] },
  ]) {
    assert.equal(goalsSchema.safeParse(invalid).success, false);
  }
});

test("a criação devolve targetMonths anulável (mensal não tem prazo)", () => {
  assert.equal(
    createdGoalSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      kind: "MONTHLY",
      targetMonths: null,
      startMonth: "2026-09-01T00:00:00.000Z",
    }).targetMonths,
    null,
  );
});

test("uma lista vazia é válida", () => {
  assert.deepEqual(goalsSchema.parse({ goals: [] }), { goals: [] });
});
