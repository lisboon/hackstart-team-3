import assert from "node:assert/strict";
import test from "node:test";
import {
  dailyEntrySchema,
  moodRecordSchema,
  moodScaleSchema,
} from "../src/schemas/wellbeing.ts";

const ENTRY_DATE = "2026-09-19T00:00:00.000Z";

test("the day accepts the published contract in both states", () => {
  assert.deepEqual(
    dailyEntrySchema.parse({
      entryDate: ENTRY_DATE,
      answered: false,
      mood: null,
    }),
    { entryDate: ENTRY_DATE, answered: false, mood: null },
  );
  assert.deepEqual(
    dailyEntrySchema.parse({
      entryDate: ENTRY_DATE,
      answered: true,
      mood: 3,
    }),
    { entryDate: ENTRY_DATE, answered: true, mood: 3 },
  );
});

test("the scale is the five integers of the contract, nothing else", () => {
  for (const mood of [1, 2, 3, 4, 5])
    assert.equal(moodScaleSchema.safeParse(mood).success, true);
  for (const mood of [0, 6, 2.5, -1, "3", null])
    assert.equal(moodScaleSchema.safeParse(mood).success, false, String(mood));
});

test("the day rejects what the screen cannot trust", () => {
  for (const invalid of [
    { entryDate: ENTRY_DATE, answered: true, mood: 7 },
    { entryDate: ENTRY_DATE, answered: "yes", mood: 3 },
    { entryDate: "2026-09-19", answered: true, mood: 3 },
    { entryDate: ENTRY_DATE, mood: 3 },
    { answered: true, mood: 3 },
  ])
    assert.equal(dailyEntrySchema.safeParse(invalid).success, false);
});

test("the record confirms a day that was answered, never an empty one", () => {
  assert.deepEqual(moodRecordSchema.parse({ entryDate: ENTRY_DATE, mood: 1 }), {
    entryDate: ENTRY_DATE,
    mood: 1,
  });
  assert.equal(
    moodRecordSchema.safeParse({ entryDate: ENTRY_DATE, mood: null }).success,
    false,
  );
  assert.deepEqual(
    Object.keys(
      moodRecordSchema.parse({ entryDate: ENTRY_DATE, mood: 2, userId: "x" }),
    ),
    ["entryDate", "mood"],
  );
});
