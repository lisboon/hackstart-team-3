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

const PASSWORD = "Sup3rSecret!";
const SLUG = "e2e-unidade-feriado";
const WORKER = "e2e-feriado-worker@backend.com.br";
/**
 * Fuso UTC de proposito. A janela le a excecao no calendario da unidade, e a
 * ofensiva conta os dias em UTC (`DailyEntry.entryDate`). Em UTC os dois
 * calendarios sao o mesmo, e o teste deixa de depender da hora em que roda.
 * O fuso tem o teste dele em `journey-window-by-unit.e2e-spec.ts`.
 */
const ZONE = "UTC";

/**
 * A janela abre a semana inteira, das 00:00 às 24:00 — a unidade está sempre
 * aberta, **exceto** no dia marcado como exceção. Assim o teste não depende da
 * hora em que o CI roda: o que ele prova é o feriado, e só ele.
 */
const ALWAYS_OPEN = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  opensAt: 0,
  closesAt: 1440,
}));

/** O dia de hoje no calendário da unidade, como as exceções são guardadas. */
const todayIn = (zone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

describe("Journey window exceptions (e2e)", () => {
  let app: INestApplication<App>;
  let token: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({ where: { email: WORKER } });
    await prisma.company.deleteMany({ where: { slug: SLUG } });

    const company = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: "Unidade Feriado",
        slug: SLUG,
        journeyZone: ZONE,
        journeyShifts: { create: ALWAYS_OPEN },
      },
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

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: WORKER, password: PASSWORD });
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { email: WORKER } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("is open while no day is marked as an exception", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.window.open).toBe(true);
  });

  describe("once today is marked as a holiday", () => {
    beforeAll(async () => {
      await prisma.companyJourneyException.create({
        data: {
          id: randomUUID(),
          companyId,
          date: new Date(`${todayIn(ZONE)}T00:00:00.000Z`),
          reason: "Feriado municipal",
        },
      });
    });

    it("closes the window for the whole day", async () => {
      const response = await request(app.getHttpServer())
        .get("/me/today")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.window.open).toBe(false);
      expect(Date.parse(response.body.window.opensAt)).toBeGreaterThan(
        Date.now(),
      );
    });

    it("refuses the mood, the same way it does outside working hours", async () => {
      await request(app.getHttpServer())
        .post("/me/today/mood")
        .set("Authorization", `Bearer ${token}`)
        .send({ mood: 4 })
        .expect(403);
    });

    it("refuses the piece", async () => {
      await request(app.getHttpServer())
        .post("/me/today/answer")
        .set("Authorization", `Bearer ${token}`)
        .send({ contentPieceId: randomUUID(), answer: "Guardo" })
        .expect(403);
    });

    it("does not count the holiday as a missed day in the streak", async () => {
      // O critério da #77: dia sem janela não conta como falha. Hoje é
      // feriado e não tem registro — a semana o mostra fechado, não perdido.
      const response = await request(app.getHttpServer())
        .get("/me/streak")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const today = response.body.week.find(
        (day: { date: string; state: string }) =>
          day.date.slice(0, 10) === new Date().toISOString().slice(0, 10),
      );
      expect(today?.state).toBe("closed");
    });

    it("writes nothing while the unit is closed", async () => {
      const entries = await prisma.dailyEntry.count({ where: { companyId } });
      expect(entries).toBe(0);
    });
  });
});
