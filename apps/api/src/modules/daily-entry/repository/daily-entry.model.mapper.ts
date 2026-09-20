import type { DailyEntry as DailyEntryModel } from "@prisma/client";
import { DailyEntry } from "../domain/daily-entry.entity";

export class DailyEntryModelMapper {
  static toEntity(data: DailyEntryModel): DailyEntry {
    return new DailyEntry({
      id: data.id,
      userId: data.userId,
      companyId: data.companyId,
      entryDate: data.entryDate,
      mood: data.mood,
      moodDeclared: data.moodDeclared,
      note: data.note ?? undefined,
      contentPieceId: data.contentPieceId ?? undefined,
      answer: data.answer ?? undefined,
      comprehended: data.comprehended ?? undefined,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    });
  }
}
