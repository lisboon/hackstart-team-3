import assert from "node:assert/strict";
import test from "node:test";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
  MOOD_LEVELS,
  SUPPORT_PATHS,
  isSuffering,
} from "../src/components/wellbeing/mood-presentation.ts";

test("the scale has five distinct levels", () => {
  assert.equal(MOOD_LEVELS.length, 5);
  assert.equal(new Set(MOOD_LEVELS.map((level) => level.value)).size, 5);
  for (const level of MOOD_LEVELS) assert.ok(level.label.length > 0);
});

test("the two lowest levels open support, the others do not", () => {
  assert.equal(isSuffering("VERY_LOW"), true);
  assert.equal(isSuffering("LOW"), true);
  assert.equal(isSuffering("NEUTRAL"), false);
  assert.equal(isSuffering("GOOD"), false);
  assert.equal(isSuffering("VERY_GOOD"), false);
});

test("the manager is on the list and is never the first option", () => {
  const managerIndex = SUPPORT_PATHS.findIndex((path) =>
    /gestor/i.test(path.title),
  );
  assert.ok(managerIndex > 0, "manager must be listed, never first");
  assert.ok(SUPPORT_PATHS.length >= 5);
});

test("support never asks for a reason", () => {
  const words = SUPPORT_PATHS.flatMap((path) => [path.title, path.detail])
    .concat(CARE_DISCLAIMER, CRISIS_LINE.detail)
    .join(" ");
  assert.doesNotMatch(words, /por que|porqu[eê]|motivo|explique|relate/i);
});

test("the crisis line is reachable with one tap", () => {
  assert.equal(CRISIS_LINE.href, "tel:188");
  assert.match(CRISIS_LINE.label, /188/);
});
