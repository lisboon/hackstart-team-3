import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { DailyEntry } from "../../domain/daily-entry.entity";
import {
  HIGHEST_MOOD,
  LOWEST_MOOD,
  MAX_MOOD_NOTE_LENGTH,
} from "../../domain/mood";

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

  it("keeps the day without a note by default", () => {
    expect(DailyEntry.create(validProps).note).toBeUndefined();
  });

  it("carries the optional note when the person specifies it", () => {
    const entry = DailyEntry.create({
      ...validProps,
      note: "Ansioso com as contas do mês.",
    });

    expect(entry.note).toBe("Ansioso com as contas do mês.");
  });

  it("treats an empty or whitespace-only note as no note", () => {
    for (const note of ["", "   ", "\n\t"]) {
      expect(DailyEntry.create({ ...validProps, note }).note).toBeUndefined();
    }
  });

  it("trims the note so the length limit is about content", () => {
    expect(DailyEntry.create({ ...validProps, note: "  oi  " }).note).toBe(
      "oi",
    );
  });

  it("attaches the note when the person declares over an automatic mood", () => {
    const automatic = DailyEntry.createAutomatic(
      {
        userId: validProps.userId,
        companyId: validProps.companyId,
        entryDate: validProps.entryDate,
      },
      3,
    );

    automatic.changeMood(LOWEST_MOOD, "Dia difícil.");

    expect(automatic.mood).toBe(LOWEST_MOOD);
    expect(automatic.moodDeclared).toBe(true);
    expect(automatic.note).toBe("Dia difícil.");
  });

  it("rejects a note longer than the limit", () => {
    const tooLong = "a".repeat(MAX_MOOD_NOTE_LENGTH + 1);

    expect(() => DailyEntry.create({ ...validProps, note: tooLong })).toThrow(
      EntityValidationError,
    );
    expect(() =>
      DailyEntry.create(validProps).changeMood(LOWEST_MOOD, tooLong),
    ).toThrow(EntityValidationError);
  });
});
