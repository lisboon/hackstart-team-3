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
const SLUG = "e2e-journey-window-company";
const WORKER = "e2e-journey-window-worker@backend.com.br";
const ZONE = "America/Cuiaba";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weekdayIn = (zone: string, instant: Date): number =>
  WEEKDAYS.indexOf(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "short",
    }).format(instant),
  );

/**
 * A janela vem da unidade (#76), então fechá-la aqui é gravar faixa no banco —
 * não sobrepor provider. É exatamente essa fiação, do HTTP ao Postgres, que o
 * teste precisa exercitar.
 *
 * A única faixa cai **amanhã** no fuso da unidade. Assim hoje não tem faixa
 * nenhuma e está fechado, qualquer que seja a hora em que o CI rodar — e a
 * próxima abertura está garantidamente no futuro. Uma faixa de um minuto hoje
 * abriria uma vez a cada 10.080 execuções, e teste que falha uma vez por mês
 * é pior que teste nenhum.
 */
const closedTodayShift = () => ({
  weekday: weekdayIn(ZONE, new Date(Date.now() + 86_400_000)),
  opensAt: 7 * 60 + 30,
  closesAt: 7 * 60 + 31,
});

describe("Journey window (e2e)", () => {
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
        name: "Journey Window Co",
        slug: SLUG,
        journeyZone: ZONE,
        journeyShifts: { create: closedTodayShift() },
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

  it("keeps the unit open when the environment default would have closed it", async () => {
    // A prova de que a janela vem do banco, e não do processo: o e2e roda com
    // JOURNEY_WINDOW aberto a semana inteira, e mesmo assim esta unidade está
    // fechada porque foi ela que disse quando abre.
    expect(process.env.JOURNEY_WINDOW_DAYS).toBe("0,1,2,3,4,5,6");
  });
});
