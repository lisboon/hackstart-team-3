import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/infra/http/app.module";
import { configureApp } from "../src/infra/http/app.setup";
import prisma from "../src/infra/database/prisma.instance";
import { UserRole } from "../src/modules/@shared/domain/enums";
import {
  CONTENT_PIECES,
  CONTENT_SOURCE_URL,
} from "../prisma/content-pieces.seed";

/** O catalogo e global: a trilha precisa existir antes de qualquer resposta. */
async function seedContentPieces(): Promise<void> {
  for (const piece of CONTENT_PIECES) {
    await prisma.contentPiece.upsert({
      where: {
        stage_orderInStage: {
          stage: piece.stage,
          orderInStage: piece.orderInStage,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        stage: piece.stage,
        orderInStage: piece.orderInStage,
        title: piece.title,
        body: piece.body,
        prompt: piece.prompt,
        options: piece.options as unknown as object,
        sourceUrl: CONTENT_SOURCE_URL,
      },
    });
  }
}

const PASSWORD = "Sup3rSecret!";
const SLUG = "e2e-daily-mood-company";
const WORKER = "e2e-daily-mood-worker@backend.com.br";
const ADMIN = "e2e-daily-mood-admin@backend.com.br";
const EMAILS = [WORKER, ADMIN];

describe("Daily mood (e2e)", () => {
  let app: INestApplication<App>;
  let workerToken: string;
  let adminToken: string;
  let companyId: string;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({ where: { slug: SLUG } });
    await seedContentPieces();

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Daily Mood Co", slug: SLUG },
    });
    companyId = company.id;

    for (const [email, role] of [
      [WORKER, UserRole.USER],
      [ADMIN, UserRole.ADMIN],
    ] as const) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          name: email,
          email,
          password: await bcrypt.hash(PASSWORD, 10),
          role,
          companyId,
        },
      });
    }

    workerToken = await login(WORKER);
    adminToken = await login(ADMIN);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated entry", async () => {
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .send({ mood: 3 })
      .expect(401);
  });

  it("records how the person is feeling today", async () => {
    const response = await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ mood: 2 })
      .expect(201);

    expect(response.body.mood).toBe(2);
    expect(response.body.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00/);
  });

  it("refuses a second answer on the same day", async () => {
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ mood: 5 })
      .expect(409);

    const stored = await prisma.dailyEntry.findMany({ where: { companyId } });
    expect(stored).toHaveLength(1);
    expect(stored[0].mood).toBe(2);
  });

  it("offers no content until the mood opens the day", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({ answered: false, piece: null });
  });

  it("walks the COOPS track and hides the outcome until the choice", async () => {
    const today = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(200);

    expect(today.body.pieceAnswered).toBe(false);
    expect(today.body.piece.stage).toBe("CONSCIENTIZAR");
    expect(today.body.piece.sourceUrl).toContain("napontadolapis");
    for (const option of today.body.piece.options) {
      expect(Object.keys(option)).toEqual(["label"]);
    }

    const answered = await request(app.getHttpServer())
      .post("/me/today/answer")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        contentPieceId: today.body.piece.id,
        answer: today.body.piece.options[0].label,
      })
      .expect(201);

    expect(answered.body.outcome).toEqual(expect.any(String));
    expect(answered.body.comprehended).toBe(true);

    const after = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(200);
    expect(after.body).toMatchObject({ pieceAnswered: true, piece: null });
  });

  it("refuses a second answer to the piece on the same day", async () => {
    // Qualquer peca e qualquer rotulo: com o dia fechado, a resposta e 409
    // antes de o servidor olhar o conteudo do envio.
    const [piece] = await prisma.contentPiece.findMany({
      where: { stage: "SUSTENTAR" },
      take: 1,
    });
    await request(app.getHttpServer())
      .post("/me/today/answer")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ contentPieceId: piece.id, answer: "qualquer coisa" })
      .expect(409);
  });

  it("tells the screen whether today is already answered", async () => {
    const answered = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(200);
    expect(answered.body).toMatchObject({ answered: true, mood: 2 });

    const untouched = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(untouched.body).toMatchObject({ answered: false, mood: null });
  });

  it("rejects a mood outside the scale", async () => {
    for (const mood of [0, 6, 2.5, "tres"]) {
      await request(app.getHttpServer())
        .post("/me/today/mood")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ mood })
        .expect(422);
    }
  });

  it("ignores identity sent in the body and uses the session", async () => {
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mood: 4, userId: randomUUID(), companyId })
      .expect(422);
  });

  it("keeps each person's entry to themselves, including from an ADMIN", async () => {
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mood: 1 })
      .expect(201);

    // Duas pessoas da mesma empresa, dois registros distintos: o ADMIN
    // escreveu o proprio dia, nao o do colaborador.
    const entries = await prisma.dailyEntry.findMany({
      where: { companyId },
      select: { userId: true, mood: true },
    });
    expect(entries).toHaveLength(2);
    expect(new Set(entries.map((entry) => entry.userId)).size).toBe(2);
  });
});
