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
import DailyEntryFacade from "../src/modules/daily-entry/facade/daily-entry.facade";
import DailyEntryFacadeFactory from "../src/modules/daily-entry/factory/facade.factory";
import { JourneyWindow } from "../src/modules/daily-entry/domain/journey-window";

const PASSWORD = "Sup3rSecret!";
const SLUG = "e2e-journey-window-company";
const WORKER = "e2e-journey-window-worker@backend.com.br";

/**
 * Uma janela que nunca abre. A configuração é lida no escopo do módulo, então
 * trocar variável de ambiente depois do import não teria efeito — sobrepor a
 * fábrica exercita a mesma fiação que produção usa, do HTTP até o domínio.
 */
const NEVER_OPEN: JourneyWindow = {
  zone: "America/Cuiaba",
  days: [1],
  opensAt: { hour: 7, minute: 30 },
  closesAt: { hour: 7, minute: 31 },
};

describe("Journey window (e2e)", () => {
  let app: INestApplication<App>;
  let token: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DailyEntryFacade)
      .useValue(DailyEntryFacadeFactory.create(NEVER_OPEN))
      .compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({ where: { email: WORKER } });
    await prisma.company.deleteMany({ where: { slug: SLUG } });

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Journey Window Co", slug: SLUG },
    });
    companyId = company.id;

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: WORKER,
        email: WORKER,
        password: await bcrypt.hash(PASSWORD, 10),
        role: UserRole.USER,
        companyId,
      },
    });

    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: WORKER, password: PASSWORD });
    token = response.body.accessToken;
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { email: WORKER } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("still lets the person in, because the door never closes", async () => {
    // Fechar a entrada tornaria o CVV 188 inalcançável à noite e no fim de
    // semana, que é quando ele mais importa.
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: WORKER, password: PASSWORD })
      .expect(201);
  });

  it("tells the screen the window is closed, and when it opens", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.window.open).toBe(false);
    expect(Date.parse(response.body.window.opensAt)).toBeGreaterThan(
      Date.now(),
    );
  });

  it("refuses to record the mood outside the window", async () => {
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${token}`)
      .send({ mood: 4 })
      .expect(403);
  });

  it("refuses to answer the piece outside the window", async () => {
    await request(app.getHttpServer())
      .post("/me/today/answer")
      .set("Authorization", `Bearer ${token}`)
      .send({ contentPieceId: randomUUID(), answer: "Guardo" })
      .expect(403);
  });

  it("writes nothing while the window is closed", async () => {
    const entries = await prisma.dailyEntry.count({ where: { companyId } });
    expect(entries).toBe(0);
  });
});
