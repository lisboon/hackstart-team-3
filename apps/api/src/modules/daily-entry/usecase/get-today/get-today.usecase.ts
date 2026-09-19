import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetTodayEntryUseCaseInputDto,
  GetTodayEntryUseCaseInterface,
  GetTodayEntryUseCaseOutputDto,
} from "./get-today.usecase.dto";

export default class GetTodayEntryUseCase implements GetTodayEntryUseCaseInterface {
  constructor(private readonly dailyEntryGateway: DailyEntryGateway) {}

  async execute(
    data: GetTodayEntryUseCaseInputDto,
  ): Promise<GetTodayEntryUseCaseOutputDto> {
    const entryDate = normalizeToDayStart(data.today);
    const entry = await this.dailyEntryGateway.findByDate(
      { userId: data.userId, companyId: data.companyId },
      entryDate,
    );

    return {
      entryDate,
      answered: entry !== null,
      mood: entry?.mood ?? null,
    };
  }
}
