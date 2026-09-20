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
const SLUG = "e2e-journey-company";
const WALKER = "e2e-journey-walker@backend.com.br";
const NEWCOMER = "e2e-journey-newcomer@backend.com.br";
const EMAILS = [WALKER, NEWCOMER];

interface JourneyNode {
  id: string;
  state: "answered" | "current" | "locked";
  title: string;
  body: string | null;
  options: { label: string }[] | null;
  answer: string | null;
  outcome: string | null;
}

describe("Journey map (e2e)", () => {
  let app: INestApplication<App>;
  let walkerToken: string;
  let newcomerToken: string;
  let companyId: string;
  let answeredLabel: string;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken as string;
  };

  const journey = (token: string) =>
    request(app.getHttpServer())
      .get("/me/journey")
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
      data: { id: randomUUID(), name: "Journey Co", slug: SLUG },
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
    answeredLabel = today.body.piece.options[0].label;
    await request(app.getHttpServer())
      .post("/me/today/answer")
      .set("Authorization", `Bearer ${walkerToken}`)
      .send({ contentPieceId: today.body.piece.id, answer: answeredLabel });
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("returns the whole catalogue as nodes", async () => {
    const response = await journey(newcomerToken).expect(200);

    expect(response.body.nodes.length).toBe(CONTENT_PIECES.length);
  });

  it("gives a newcomer one current node and locks the rest", async () => {
    const response = await journey(newcomerToken).expect(200);
    const nodes: JourneyNode[] = response.body.nodes;

    expect(nodes.filter((n) => n.state === "current")).toHaveLength(1);
    expect(nodes.filter((n) => n.state === "answered")).toHaveLength(0);
    expect(nodes[0].state).toBe("current");
    expect(nodes.slice(1).every((n) => n.state === "locked")).toBe(true);
  });

  it("hides body and options of a locked node", async () => {
    const response = await journey(newcomerToken).expect(200);
    const locked = (response.body.nodes as JourneyNode[]).find(
      (n) => n.state === "locked",
    );

    expect(locked).toBeDefined();
    expect(locked?.body).toBeNull();
    expect(locked?.options).toBeNull();
  });

  it("opens the current piece with options but no outcome", async () => {
    const response = await journey(newcomerToken).expect(200);
    const current = (response.body.nodes as JourneyNode[]).find(
      (n) => n.state === "current",
    );

    expect(current?.options?.length).toBeGreaterThan(0);
    expect(current?.outcome).toBeNull();
    expect(current?.answer).toBeNull();
  });

  it("shows an answered piece in read-only, with its outcome and no options", async () => {
    const response = await journey(walkerToken).expect(200);
    const answered = (response.body.nodes as JourneyNode[]).find(
      (n) => n.state === "answered",
    );

    expect(answered).toBeDefined();
    expect(answered?.answer).toBe(answeredLabel);
    expect(typeof answered?.outcome).toBe("string");
    expect(answered?.outcome?.length ?? 0).toBeGreaterThan(0);
    // A decisão não se refaz: sem opções para escolher de novo.
    expect(answered?.options).toBeNull();
  });

  it("does not leak one person's progress into another's", async () => {
    const mine = await journey(walkerToken).expect(200);
    const theirs = await journey(newcomerToken).expect(200);

    const answeredCount = (body: { nodes: JourneyNode[] }) =>
      body.nodes.filter((n) => n.state === "answered").length;

    expect(answeredCount(mine.body)).toBe(1);
    expect(answeredCount(theirs.body)).toBe(0);
  });

  it("returns nothing that identifies the person", async () => {
    const response = await journey(walkerToken).expect(200);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("userId");
    expect(body).not.toContain(WALKER);
  });

  it("refuses an anonymous request", async () => {
    await request(app.getHttpServer()).get("/me/journey").expect(401);
  });
});
