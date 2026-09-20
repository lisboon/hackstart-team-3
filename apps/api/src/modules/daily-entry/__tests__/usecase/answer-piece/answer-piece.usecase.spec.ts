import { CoopsStage } from "@/modules/@shared/domain/enums";
import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { ContentPiece } from "@/modules/content-piece/domain/content-piece.entity";
import { ContentPieceGateway } from "@/modules/content-piece/gateway/content-piece.gateway";
import { DailyEntry } from "../../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import AnswerPieceUseCase from "../../../usecase/answer-piece/answer-piece.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const lateInTheDay = new Date(Date.UTC(2026, 8, 19, 22, 40));

const piece: ContentPiece = {
  id: "8b3d5f7a-2c4e-4d6f-9a1b-3c5d7e9f0a1b",
  stage: CoopsStage.OBSERVAR,
  orderInStage: 1,
  title: "Para onde o dinheiro foi",
  body: "Observar é o segundo passo do COOPS.",
  prompt: "Sobrou R$ 50 este mês. O que você faz?",
  options: [
    {
      label: "Guardo",
      outcome: "Vira reserva e continua sendo seu.",
      demonstratesComprehension: true,
    },
    {
      label: "Deixo na conta",
      outcome: "Costuma somer no meio do mês seguinte.",
      demonstratesComprehension: false,
    },
  ],
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

const dailyGateway = (existing: DailyEntry | null): DailyEntryGateway => ({
  findByDate: jest.fn().mockResolvedValue(existing),
  findAnsweredPieceIds: jest.fn().mockResolvedValue([]),
  findAnswers: jest.fn().mockResolvedValue(new Map<string, string>()),
  findEntryDates: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
});

const contentGateway = (found: ContentPiece | null): ContentPieceGateway => ({
  findById: jest.fn().mockResolvedValue(found),
  findAll: jest.fn().mockResolvedValue(found ? [found] : []),
  findNext: jest.fn(),
  countByStage: jest.fn(),
});

const entryWithMood = () =>
  DailyEntry.create({ userId, companyId, entryDate: lateInTheDay, mood: 3 });

const input = (answer: string) => ({
  userId,
  companyId,
  today: lateInTheDay,
  contentPieceId: piece.id,
  answer,
});

describe("AnswerPieceUseCase", () => {
  it("records the choice and reports that it matched the lesson", async () => {
    const entry = entryWithMood();
    const daily = dailyGateway(entry);

    const output = await new AnswerPieceUseCase(
      daily,
      contentGateway(piece),
    ).execute(input("Guardo"));

    expect(output.comprehended).toBe(true);
    expect(output.outcome).toBe("Vira reserva e continua sendo seu.");
    expect(output.sourceUrl).toBe(piece.sourceUrl);
    expect(daily.update).toHaveBeenCalledWith(entry);
  });

  it("shows the outcome even when the choice did not match the lesson", async () => {
    const output = await new AnswerPieceUseCase(
      dailyGateway(entryWithMood()),
      contentGateway(piece),
    ).execute(input("Deixo na conta"));

    // A pessoa aprende vendo a consequência: escolher diferente não é erro,
    // só não conta como compreensão.
    expect(output.comprehended).toBe(false);
    expect(output.outcome).toBe("Costuma somer no meio do mês seguinte.");
  });

  it("opens the day with an automatic, undeclared mood when there is none yet", async () => {
    const daily = dailyGateway(null);

    const output = await new AnswerPieceUseCase(
      daily,
      contentGateway(piece),
    ).execute(input("Guardo"));

    // Colheita não depende do humor: sem dia aberto, a resposta cria a entrada
    // com humor neutro automático (não declarado), em vez de recusar.
    expect(output.comprehended).toBe(true);
    expect(daily.create).toHaveBeenCalledTimes(1);
    expect(daily.update).not.toHaveBeenCalled();
    const created = (daily.create as jest.Mock).mock.calls[0][0] as DailyEntry;
    expect(created.moodDeclared).toBe(false);
    expect(created.pieceAnswered).toBe(true);
  });

  it("refuses a second answer on the same day", async () => {
    const entry = entryWithMood();
    entry.answerPiece(piece.id, "Guardo", true);

    await expect(
      new AnswerPieceUseCase(
        dailyGateway(entry),
        contentGateway(piece),
      ).execute(input("Deixo na conta")),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an option that does not belong to the piece", async () => {
    await expect(
      new AnswerPieceUseCase(
        dailyGateway(entryWithMood()),
        contentGateway(piece),
      ).execute(input("Compro parcelado")),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a piece that does not exist", async () => {
    await expect(
      new AnswerPieceUseCase(
        dailyGateway(entryWithMood()),
        contentGateway(null),
      ).execute(input("Guardo")),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
