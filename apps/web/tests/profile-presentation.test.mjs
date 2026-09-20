import assert from "node:assert/strict";
import test from "node:test";
import {
  completedStages,
  declaredMonthsCount,
  isStageComplete,
  milestones,
  ringDash,
  ringGeometry,
  stageRatio,
  trackMilestones,
  trackRatio,
  trajectoryMilestones,
} from "../src/components/profile/achievements-presentation.ts";

const fullTrack = {
  stages: [
    { stage: "CONSCIENTIZAR", total: 6, answered: 6 },
    { stage: "OBSERVAR", total: 6, answered: 6 },
    { stage: "ORGANIZAR", total: 6, answered: 3 },
    { stage: "PREPARAR", total: 6, answered: 0 },
    { stage: "SUSTENTAR", total: 6, answered: 0 },
  ],
};

const emptyTrack = {
  stages: [
    { stage: "CONSCIENTIZAR", total: 6, answered: 0 },
    { stage: "OBSERVAR", total: 6, answered: 0 },
    { stage: "ORGANIZAR", total: 6, answered: 0 },
    { stage: "PREPARAR", total: 6, answered: 0 },
    { stage: "SUSTENTAR", total: 6, answered: 0 },
  ],
};

test("stage ratio is clamped and treats an empty stage as zero", () => {
  assert.equal(stageRatio({ total: 6, answered: 3 }), 0.5);
  assert.equal(stageRatio({ total: 6, answered: 6 }), 1);
  assert.equal(stageRatio({ total: 0, answered: 0 }), 0);
  assert.equal(stageRatio({ total: 6, answered: 9 }), 1);
});

test("a stage is complete only when every piece is answered and it has pieces", () => {
  assert.equal(isStageComplete({ total: 6, answered: 6 }), true);
  assert.equal(isStageComplete({ total: 6, answered: 5 }), false);
  assert.equal(isStageComplete({ total: 0, answered: 0 }), false);
});

test("completed stages and track ratio come from real counts", () => {
  assert.equal(completedStages(fullTrack), 2);
  assert.equal(completedStages(emptyTrack), 0);
  assert.equal(trackRatio(fullTrack), 15 / 30);
  assert.equal(trackRatio(emptyTrack), 0);
  assert.equal(trackRatio({ stages: [] }), 0);
});

test("declared months never goes negative and mirrors the summary", () => {
  assert.equal(declaredMonthsCount({ declaredMonths: 0 }), 0);
  assert.equal(declaredMonthsCount({ declaredMonths: 4 }), 4);
});

test("locked milestones are present, not hidden", () => {
  // The five COOPS stages always come back as milestones, even at answered 0:
  // the grid shows the whole path, dimmed but visible.
  const track = trackMilestones(emptyTrack);
  assert.equal(track.length, 5);
  assert.ok(track.every((milestone) => milestone.achieved === false));
  // Every track milestone carries its COOPS stage so the view can name it.
  assert.deepEqual(
    track.map((milestone) => milestone.stage),
    ["CONSCIENTIZAR", "OBSERVAR", "ORGANIZAR", "PREPARAR", "SUSTENTAR"],
  );

  const all = milestones({ declaredMonths: 0 }, emptyTrack);
  // three trajectory milestones + five track milestones, none achieved.
  assert.equal(all.length, 8);
  assert.ok(all.some((milestone) => milestone.kind === "trajectory"));
  assert.ok(all.some((milestone) => milestone.kind === "track"));
  assert.ok(all.every((milestone) => milestone.achieved === false));
});

test("trajectory milestones unlock with declared months", () => {
  const three = trajectoryMilestones({ declaredMonths: 3 });
  assert.deepEqual(
    three.map((milestone) => milestone.achieved),
    [true, true, false],
  );
});

test("no milestone text compares the person with anyone else", () => {
  const all = milestones({ declaredMonths: 6 }, fullTrack);
  const words = all
    .flatMap((milestone) => [milestone.label, milestone.description])
    .join(" ")
    .toLowerCase();
  // No ranking, no average, no "better/worse than", no score words.
  assert.doesNotMatch(
    words,
    /m[ée]dia|ranking|melhor que|pior que|acima|abaixo|placar|pontos|errado|nota/,
  );
});

test("ring geometry and dash are proportional", () => {
  const { radius, circumference } = ringGeometry(120, 10);
  assert.equal(radius, 55);
  assert.equal(circumference, 2 * Math.PI * 55);
  assert.equal(ringDash(circumference, 0), 0);
  assert.equal(ringDash(circumference, 1), circumference);
  assert.equal(ringDash(circumference, 0.5), circumference / 2);
  assert.equal(ringDash(circumference, 2), circumference);
});
