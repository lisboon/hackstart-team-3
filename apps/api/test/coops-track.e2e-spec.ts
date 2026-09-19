import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/infra/http/app.module";
import { configureApp } from "../src/infra/http/app.setup";
import prisma from "../src/infra/database/prisma.instance";
import { COOPS_ORDER, UserRole } from "../src/modules/@shared/domain/enums";
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
const SLUG = "e2e-coops-track-company";
const WALKER = "e2e-track-walker@backend.com.br";
const NEWCOMER = "e2e-track-newcomer@backend.com.br";
const EMAILS = [WALKER, NEWCOMER];

describe("COOPS track (e2e)", () => {
  let app: INestApplication<App>;
  let walkerToken: string;
  let newcomerToken: string;
  let companyId: string;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken as string;
  };

  const track = (token: string) =>
    request(app.getHttpServer())
      .get("/me/track")
      .set("Authorization", `Bearer ${token}`);

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
      data: { id: randomUUID(), name: "Track Co", slug: SLUG },
    });
    companyId = company.id;
    const password = await bcrypt.hash(PASSWORD, 10);
    for (const email of EMAILS) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          name: email,
          email,
          password,
          role: UserRole.USER,
          companyId,
        },
      });
    }

    walkerToken = await login(WALKER);
    newcomerToken = await login(NEWCOMER);

    // O caminhante abre o dia e responde a peça de hoje.
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${walkerToken}`)
      .send({ mood: 4 });
    const today = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${walkerToken}`);
    await request(app.getHttpServer())
      .post("/me/today/answer")
      .set("Authorization", `Bearer ${walkerToken}`)
      .send({
        contentPieceId: today.body.piece.id,
        answer: today.body.piece.options[0].label,
      });
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("always returns the five stages, in method order", async () => {
    const response = await track(newcomerToken).expect(200);

    expect(response.body.stages.map((s: { stage: string }) => s.stage)).toEqual(
      [...COOPS_ORDER],
    );
  });

  it("keeps a stage with no answer instead of dropping it", async () => {
    const response = await track(newcomerToken).expect(200);

    // A trilha mostra o caminho inteiro: some uma etapa e a pessoa deixa de
    // saber que ela existe.
    for (const stage of response.body.stages) {
      expect(stage.answered).toBe(0);
      expect(stage.total).toBeGreaterThan(0);
    }
  });

  it("counts an answered piece in its own stage", async () => {
    const response = await track(walkerToken).expect(200);

    const answered = response.body.stages.filter(
      (s: { answered: number }) => s.answered > 0,
    );
    expect(answered).toHaveLength(1);
    expect(answered[0].answered).toBe(1);
  });

  it("does not leak one person's progress into another's", async () => {
    const mine = await track(walkerToken).expect(200);
    const theirs = await track(newcomerToken).expect(200);

    const sum = (body: { stages: { answered: number }[] }) =>
      body.stages.reduce((total, s) => total + s.answered, 0);

    expect(sum(mine.body)).toBe(1);
    expect(sum(theirs.body)).toBe(0);
  });

  it("returns nothing individual beyond the counts", async () => {
    const response = await track(walkerToken).expect(200);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("userId");
    expect(body).not.toContain(WALKER);
  });

  it("refuses an anonymous request", async () => {
    await request(app.getHttpServer()).get("/me/track").expect(401);
  });
});
