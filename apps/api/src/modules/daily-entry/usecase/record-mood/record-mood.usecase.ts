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

    // Uma resposta por dia, sem correção: a pergunta é como a pessoa está
    // agora, e deixar reescrever convidaria a ajustar a resposta ao que ela
    // acha que deveria sentir. O dia seguinte é a próxima chance.
    if (await this.dailyEntryGateway.findByDate(owner, entryDate)) {
      throw new ConflictError("Today is already answered");
    }

    const entry = DailyEntry.create({ ...owner, entryDate, mood: data.mood });
    await this.dailyEntryGateway.create(entry);

    return { entryDate: entry.entryDate, mood: entry.mood };
  }
}
