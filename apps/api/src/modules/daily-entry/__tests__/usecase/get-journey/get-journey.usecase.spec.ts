import { CoopsStage } from "@/modules/@shared/domain/enums";
import { ContentPiece } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetJourneyUseCase from "../../../usecase/get-journey/get-journey.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";

const piece = (
  id: string,
  stage: CoopsStage,
  orderInStage: number,
): ContentPiece => ({
  id,
  stage,
  orderInStage,
  title: `Peça ${id}`,
  body: `Corpo de ${id}`,
  prompt: `Pergunta de ${id}`,
  options: [
    {
      label: "Guardo",
      outcome: "Vira reserva.",
      demonstratesComprehension: true,
    },
    {
      label: "Gasto",
      outcome: "Some no meio do mês.",
      demonstratesComprehension: false,
    },
  ],
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
});

// Três peças na ordem da trilha: uma etapa com duas peças e outra com uma.
const CATALOGUE: ContentPiece[] = [
  piece("a", CoopsStage.CONSCIENTIZAR, 1),
  piece("b", CoopsStage.CONSCIENTIZAR, 2),
  piece("c", CoopsStage.OBSERVAR, 1),
];

const dailyGateway = (answers: Map<string, string>): DailyEntryGateway => ({
  findByDate: jest.fn(),
  findAnsweredPieceIds: jest.fn(),
  findAnswers: jest.fn().mockResolvedValue(answers),
  findEntryDates: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
});

const contentGateway = (pieces: ContentPiece[]): ContentPieceGateway => ({
  findById: jest.fn(),
  findAll: jest.fn().mockResolvedValue(pieces),
  findNext: jest.fn(),
  countByStage: jest.fn(),
});

describe("GetJourneyUseCase", () => {
  it("returns every piece, in catalogue order", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map()),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    expect(output.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("marks the first unanswered piece as current and locks the rest", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map()),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    expect(output.nodes.map((n) => n.state)).toEqual([
      "current",
      "locked",
      "locked",
    ]);
  });

  it("keeps exactly one current node even with gaps in what was answered", async () => {
    // Respondeu a primeira; a segunda vira a atual, e a terceira tranca.
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map([["a", "Guardo"]])),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    expect(output.nodes.map((n) => n.state)).toEqual([
      "answered",
      "current",
      "locked",
    ]);
    expect(output.nodes.filter((n) => n.state === "current")).toHaveLength(1);
  });

  it("gives an answered node its chosen label and the outcome of that choice", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map([["a", "Gasto"]])),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    const answered = output.nodes[0];
    expect(answered.state).toBe("answered");
    expect(answered.answer).toBe("Gasto");
    expect(answered.outcome).toBe("Some no meio do mês.");
    // A decisão não se refaz: um nó respondido não traz opções.
    expect(answered.options).toBeNull();
  });

  it("never leaks the outcome of the current piece before it is answered", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map()),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    const current = output.nodes[0];
    expect(current.state).toBe("current");
    expect(current.options).toEqual([{ label: "Guardo" }, { label: "Gasto" }]);
    expect(current.outcome).toBeNull();
    expect(current.answer).toBeNull();
  });

  it("gives a locked node nothing beyond its label", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map()),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    const locked = output.nodes[1];
    expect(locked.state).toBe("locked");
    expect(locked.body).toBeNull();
    expect(locked.prompt).toBeNull();
    expect(locked.options).toBeNull();
    expect(locked.outcome).toBeNull();
    expect(locked.title).toBe("Peça b");
  });

  it("leaves the outcome null when the stored label no longer matches an option", async () => {
    // Peça editada depois da resposta: não inventamos um texto de consequência.
    const output = await new GetJourneyUseCase(
      dailyGateway(new Map([["a", "Opção que sumiu"]])),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    const answered = output.nodes[0];
    expect(answered.state).toBe("answered");
    expect(answered.answer).toBe("Opção que sumiu");
    expect(answered.outcome).toBeNull();
  });

  it("reads the answers of the person in the session, with the company", async () => {
    const daily = dailyGateway(new Map());
    await new GetJourneyUseCase(daily, contentGateway(CATALOGUE)).execute({
      userId,
      companyId,
    });

    expect(daily.findAnswers).toHaveBeenCalledWith({ userId, companyId });
  });

  it("locks everything after the last piece is answered, with no current", async () => {
    const output = await new GetJourneyUseCase(
      dailyGateway(
        new Map([
          ["a", "Guardo"],
          ["b", "Guardo"],
          ["c", "Guardo"],
        ]),
      ),
      contentGateway(CATALOGUE),
    ).execute({ userId, companyId });

    expect(output.nodes.every((n) => n.state === "answered")).toBe(true);
  });
});
