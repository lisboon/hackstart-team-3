import { CoopsStage, COOPS_ORDER } from "@/modules/@shared/domain/enums";
import {
  ContentPieceGateway,
  StageCount,
} from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetTrackUseCase from "../../../usecase/get-track/get-track.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";

const full: StageCount[] = COOPS_ORDER.map((stage) => ({ stage, count: 6 }));

const dailyGateway = (answeredIds: string[]): DailyEntryGateway => ({
  findByDate: jest.fn(),
  findAnsweredPieceIds: jest.fn().mockResolvedValue(answeredIds),
  findAnswers: jest.fn().mockResolvedValue(new Map<string, string>()),
  create: jest.fn(),
  update: jest.fn(),
});

const contentGateway = (
  total: StageCount[],
  answered: StageCount[],
): ContentPieceGateway => ({
  findById: jest.fn(),
  findAll: jest.fn().mockResolvedValue([]),
  findNext: jest.fn(),
  countByStage: jest
    .fn()
    .mockImplementation((onlyIds?: string[]) =>
      Promise.resolve(onlyIds ? answered : total),
    ),
});

describe("GetTrackUseCase", () => {
  it("returns the five stages in method order", async () => {
    const output = await new GetTrackUseCase(
      dailyGateway([]),
      contentGateway(full, []),
    ).execute({ userId, companyId });

    expect(output.stages.map((s) => s.stage)).toEqual([
      CoopsStage.CONSCIENTIZAR,
      CoopsStage.OBSERVAR,
      CoopsStage.ORGANIZAR,
      CoopsStage.PREPARAR,
      CoopsStage.SUSTENTAR,
    ]);
  });

  it("reports progress per stage", async () => {
    const output = await new GetTrackUseCase(
      dailyGateway(["a", "b", "c", "d"]),
      contentGateway(full, [
        { stage: CoopsStage.CONSCIENTIZAR, count: 6 },
        { stage: CoopsStage.OBSERVAR, count: 2 },
      ]),
    ).execute({ userId, companyId });

    expect(output.stages[0]).toEqual({
      stage: CoopsStage.CONSCIENTIZAR,
      total: 6,
      answered: 6,
    });
    expect(output.stages[1]).toEqual({
      stage: CoopsStage.OBSERVAR,
      total: 6,
      answered: 2,
    });
  });

  it("keeps a stage with no answer instead of dropping it", async () => {
    const output = await new GetTrackUseCase(
      dailyGateway([]),
      contentGateway(full, []),
    ).execute({ userId, companyId });

    // A trilha mostra o caminho inteiro: some uma etapa e a pessoa deixa de
    // saber que ela existe.
    expect(output.stages).toHaveLength(5);
    expect(output.stages.every((s) => s.answered === 0)).toBe(true);
  });

  it("keeps a stage the catalogue has no piece for yet", async () => {
    const output = await new GetTrackUseCase(
      dailyGateway([]),
      contentGateway([{ stage: CoopsStage.CONSCIENTIZAR, count: 6 }], []),
    ).execute({ userId, companyId });

    const sustentar = output.stages[output.stages.length - 1];
    expect(sustentar).toEqual({
      stage: CoopsStage.SUSTENTAR,
      total: 0,
      answered: 0,
    });
  });

  it("asks for the answers of the person in the session, with the company", async () => {
    const daily = dailyGateway([]);
    await new GetTrackUseCase(daily, contentGateway(full, [])).execute({
      userId,
      companyId,
    });

    expect(daily.findAnsweredPieceIds).toHaveBeenCalledWith({
      userId,
      companyId,
    });
  });

  it("counts the catalogue and the answers through the same query", async () => {
    const content = contentGateway(full, []);
    await new GetTrackUseCase(dailyGateway(["a"]), content).execute({
      userId,
      companyId,
    });

    expect(content.countByStage).toHaveBeenNthCalledWith(1);
    expect(content.countByStage).toHaveBeenNthCalledWith(2, ["a"]);
  });
});
