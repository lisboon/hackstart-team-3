import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import {
  addMonths,
  normalizeToMonthStart,
} from "@/modules/@shared/domain/utils/month";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetProgressUseCaseInputDto,
  GetProgressUseCaseInterface,
  GetProgressUseCaseOutputDto,
} from "./get-progress.usecase.dto";

export default class GetProgressUseCase implements GetProgressUseCaseInterface {
  constructor(private readonly dailyEntryGateway: DailyEntryGateway) {}

  async execute(
    data: GetProgressUseCaseInputDto,
  ): Promise<GetProgressUseCaseOutputDto> {
    // Mesma leitura que serve à ofensiva: as datas da pessoa, com dono e
    // empresa juntos. Sem método novo no gateway e sem tabela nova.
    const dates = await this.dailyEntryGateway.findEntryDates({
      userId: data.userId,
      companyId: data.companyId,
    });

    const month = normalizeToMonthStart(data.today);
    const nextMonth = addMonths(month, 1);
    // O dia 0 do mês seguinte é o último dia deste — o caminho mais curto para
    // 28, 29, 30 ou 31 sem tabela de meses nem regra de ano bissexto.
    const daysInMonth = new Date(
      Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 0),
    ).getUTCDate();

    const days = [
      ...new Set(
        dates
          .map((date) => normalizeToDayStart(date))
          .filter((date) => date >= month && date < nextMonth)
          .map((date) => date.getUTCDate()),
      ),
    ].sort((a, b) => a - b);

    return { month, daysInMonth, days, total: days.length };
  }
}
