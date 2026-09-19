import assert from "node:assert/strict";
import test from "node:test";
import {
  personalSummarySchema,
  selfReportSchema,
} from "../src/schemas/financial-health.ts";

const summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 2.67,
  previousAverage: 0.33,
  declaredMonths: 6,
};

test("summary accepts the published contract", () => {
  assert.deepEqual(personalSummarySchema.parse(summary), summary);
});

test("summary keeps null apart from zero", () => {
  const undeclared = personalSummarySchema.parse({
    ...summary,
    currentSituation: null,
    recentAverage: null,
    previousAverage: null,
    declaredMonths: 0,
  });
  assert.equal(undeclared.currentSituation, null);
  assert.equal(undeclared.recentAverage, null);
  assert.equal(undeclared.previousAverage, null);
  const worst = personalSummarySchema.parse({ ...summary, recentAverage: 0 });
  assert.equal(worst.recentAverage, 0);
});

test("summary rejects payloads the screen cannot trust", () => {
  for (const invalid of [
    { ...summary, currentSituation: "SOBROU" },
    { ...summary, currentMonth: "2026-09-01" },
    { ...summary, recentAverage: "2.67" },
    { ...summary, declaredMonths: 1.5 },
    { ...summary, declaredMonths: -1 },
    { currentMonth: summary.currentMonth },
  ])
    assert.equal(personalSummarySchema.safeParse(invalid).success, false);
});

test("declaration carries only the situation, in the person's own words", () => {
  assert.deepEqual(selfReportSchema.parse({ situation: "BREAK_EVEN" }), {
    situation: "BREAK_EVEN",
  });
  assert.deepEqual(
    Object.keys(selfReportSchema.parse({ situation: "SURPLUS", userId: "x" })),
    ["situation"],
  );
  const missing = selfReportSchema.safeParse({});
  assert.equal(missing.success, false);
  assert.match(missing.error.issues[0].message, /Escolha como o mês fechou/);
});
