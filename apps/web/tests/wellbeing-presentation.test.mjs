import assert from "node:assert/strict";
import test from "node:test";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
  MOOD_LEVELS,
  SUPPORT_PATHS,
  isSuffering,
  moodLabel,
} from "../src/components/wellbeing/mood-presentation.ts";

test("the scale carries the contract values, one to five", () => {
  assert.deepEqual(
    MOOD_LEVELS.map((level) => level.value),
    [1, 2, 3, 4, 5],
  );
  for (const level of MOOD_LEVELS) {
    assert.ok(level.label.length > 0);
    assert.equal(moodLabel(level.value), level.label);
  }
});

test("the two lowest levels open support, the others do not", () => {
  assert.equal(isSuffering(1), true);
  assert.equal(isSuffering(2), true);
  assert.equal(isSuffering(3), false);
  assert.equal(isSuffering(4), false);
  assert.equal(isSuffering(5), false);
});

test("the manager is on the list and is never the first option", () => {
  const managerIndex = SUPPORT_PATHS.findIndex((path) =>
    /gestor/i.test(path.title),
  );
  assert.ok(managerIndex > 0, "manager must be listed, never first");
  assert.equal(SUPPORT_PATHS.length, 5);
});

test("support never asks for a reason", () => {
  const words = SUPPORT_PATHS.flatMap((path) => [path.title, path.detail])
    .concat(CARE_DISCLAIMER, CRISIS_LINE.detail)
    .join(" ");
  assert.doesNotMatch(words, /por que|porqu[eê]|motivo|explique|relate/i);
});

test("unvalidated channels are offered as possibilities, not guarantees", () => {
  const unvalidated = SUPPORT_PATHS.filter(
    (path) => !/gestor/i.test(path.title),
  );
  for (const path of unvalidated)
    assert.match(
      path.detail,
      /^(Se|Onde|Quando)\b/,
      `${path.title} promete em vez de oferecer: "${path.detail}"`,
    );
});

test("the crisis line is reachable with one tap", () => {
  assert.equal(CRISIS_LINE.href, "tel:188");
  assert.match(CRISIS_LINE.label, /188/);
});
