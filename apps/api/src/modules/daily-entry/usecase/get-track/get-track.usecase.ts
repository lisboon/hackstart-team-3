import { COOPS_ORDER } from "@/modules/@shared/domain/enums";
import {
  ContentPieceGateway,
  StageCount,
} from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  GetTrackUseCaseInputDto,
  GetTrackUseCaseInterface,
  GetTrackUseCaseOutputDto,
} from "./get-track.usecase.dto";

const tally = (counts: StageCount[]) =>
  new Map(counts.map((entry) => [entry.stage, entry.count]));

export default class GetTrackUseCase implements GetTrackUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly contentPieceGateway: ContentPieceGateway,
  ) {}

  async execute(
    data: GetTrackUseCaseInputDto,
  ): Promise<GetTrackUseCaseOutputDto> {
    // As peças respondidas identificam o progresso, e contá-las pelo mesmo
    // caminho do catálogo evita uma segunda leitura que poderia divergir.
    const answeredIds = await this.dailyEntryGateway.findAnsweredPieceIds({
      userId: data.userId,
      companyId: data.companyId,
    });

    const [total, answered] = await Promise.all([
      this.contentPieceGateway.countByStage(),
      this.contentPieceGateway.countByStage(answeredIds),
    ]);

    const totals = tally(total);
    const done = tally(answered);

    return {
      stages: COOPS_ORDER.map((stage) => ({
        stage,
        total: totals.get(stage) ?? 0,
        answered: done.get(stage) ?? 0,
      })),
    };
  }
}
