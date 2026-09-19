import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { DailyEntry } from "../../domain/daily-entry.entity";
import { HIGHEST_MOOD, LOWEST_MOOD } from "../../domain/mood";

const validProps = {
  userId: "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e",
  companyId: "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f",
  entryDate: new Date(Date.UTC(2026, 8, 19, 22, 40)),
  mood: 3,
};

describe("DailyEntry entity", () => {
  it("normalizes any instant of the day to its start in UTC", () => {
    const entry = DailyEntry.create(validProps);

    expect(entry.entryDate.toISOString()).toBe("2026-09-19T00:00:00.000Z");
  });

  it("accepts every level of the declared scale", () => {
    for (let mood = LOWEST_MOOD; mood <= HIGHEST_MOOD; mood += 1) {
      expect(DailyEntry.create({ ...validProps, mood }).mood).toBe(mood);
    }
  });

  it("lets the person correct how the day is going", () => {
    const entry = DailyEntry.create(validProps);

    entry.changeMood(LOWEST_MOOD);

    expect(entry.mood).toBe(LOWEST_MOOD);
  });

  it("rejects a mood outside the scale", () => {
    for (const mood of [0, 6, 2.5]) {
      expect(() => DailyEntry.create({ ...validProps, mood })).toThrow(
        EntityValidationError,
      );
    }
  });

  it("rejects an owner that is not a uuid", () => {
    expect(() => DailyEntry.create({ ...validProps, userId: "nope" })).toThrow(
      EntityValidationError,
    );
  });
});
