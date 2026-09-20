import assert from "node:assert/strict";
import test from "node:test";
import { streakSchema } from "../src/schemas/streak.ts";

const week = () =>
  Array.from({ length: 7 }, (_, i) => ({
    date: "2026-09-14T00:00:00.000Z",
    weekday: i,
    state: i < 2 ? "done" : i === 2 ? "today" : "future",
  }));

const base = (overrides) => ({
  currentStreak: 2,
  longestStreak: 5,
  week: week(),
  freezesAvailable: 1,
  freezeApplied: false,
  ...overrides,
});

test("aceita a ofensiva com recorde, semana e proteção", () => {
  const parsed = streakSchema.parse(base({}));
  assert.equal(parsed.currentStreak, 2);
  assert.equal(parsed.longestStreak, 5);
  assert.equal(parsed.week.length, 7);
});

test("exige exatamente sete dias na semana", () => {
  assert.equal(
    streakSchema.safeParse(base({ week: week().slice(0, 6) })).success,
    false,
  );
});

test("rejeita estado de dia fora do contrato", () => {
  const bad = week();
  bad[0].state = "frozen-solid";
  assert.equal(streakSchema.safeParse(base({ week: bad })).success, false);
});

test("uma ofensiva zerada ainda é válida", () => {
  const parsed = streakSchema.parse(
    base({ currentStreak: 0, longestStreak: 0 }),
  );
  assert.equal(parsed.currentStreak, 0);
});
