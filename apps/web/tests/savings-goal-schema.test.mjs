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
  targetAmountCents: 20000,
  monthlyTargetCents: 20000,
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

test("a meta carrega o valor-alvo autodeclarado, em centavos (decisão #71)", () => {
  const parsed = goalsSchema.parse({
    goals: [goal({ targetAmountCents: 60000, monthlyTargetCents: 10000 })],
  });
  assert.equal(parsed.goals[0].targetAmountCents, 60000);
  assert.equal(parsed.goals[0].monthlyTargetCents, 10000);
});

test("a leitura tolera valor 0 de metas legadas (anteriores à #71)", () => {
  // A migração preencheu metas antigas com 0; a lista não pode quebrar por isso.
  assert.equal(
    goalsSchema.safeParse({ goals: [goal({ targetAmountCents: 0, monthlyTargetCents: 0 })] })
      .success,
    true,
  );
});

test("a criação exige valor-alvo positivo", () => {
  assert.equal(
    createdGoalSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      kind: "MONTHLY",
      targetAmountCents: 0,
      targetMonths: null,
      startMonth: "2026-09-01T00:00:00.000Z",
    }).success,
    false,
  );
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

test("a criação devolve o valor-alvo e targetMonths anulável (mensal não tem prazo)", () => {
  const parsed = createdGoalSchema.parse({
    id: "11111111-1111-4111-8111-111111111111",
    kind: "MONTHLY",
    targetAmountCents: 20000,
    targetMonths: null,
    startMonth: "2026-09-01T00:00:00.000Z",
  });
  assert.equal(parsed.targetMonths, null);
  assert.equal(parsed.targetAmountCents, 20000);
});

test("uma lista vazia é válida", () => {
  assert.deepEqual(goalsSchema.parse({ goals: [] }), { goals: [] });
});
