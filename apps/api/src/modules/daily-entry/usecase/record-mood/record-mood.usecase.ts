import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { DailyEntry } from "../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  RecordMoodUseCaseInputDto,
  RecordMoodUseCaseInterface,
  RecordMoodUseCaseOutputDto,
} from "./record-mood.usecase.dto";

export default class RecordMoodUseCase implements RecordMoodUseCaseInterface {
  constructor(private readonly dailyEntryGateway: DailyEntryGateway) {}

  async execute(
    data: RecordMoodUseCaseInputDto,
  ): Promise<RecordMoodUseCaseOutputDto> {
    const owner = { userId: data.userId, companyId: data.companyId };
    const entryDate = normalizeToDayStart(data.entryDate);
    const existing = await this.dailyEntryGateway.findByDate(owner, entryDate);

    if (existing) {
      // Já houve declaração hoje: uma por dia, sem correção. A pergunta é como
      // a pessoa está agora, e reescrever convidaria a ajustar ao que ela acha
      // que deveria sentir. O dia seguinte é a próxima chance.
      if (existing.moodDeclared) {
        throw new ConflictError("Today is already answered");
      }
      // O humor era automático (a colheita abriu o dia). Agora a pessoa
      // declara de verdade: o real sobrescreve o neutro e passa a contar.
      existing.changeMood(data.mood);
      await this.dailyEntryGateway.update(existing);
      return { entryDate: existing.entryDate, mood: existing.mood };
    }

    const entry = DailyEntry.create({ ...owner, entryDate, mood: data.mood });
    await this.dailyEntryGateway.create(entry);

    return { entryDate: entry.entryDate, mood: entry.mood };
  }
}
