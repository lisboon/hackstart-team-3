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
const SLUG = "e2e-streak-company";
const WALKER = "e2e-streak-walker@backend.com.br";
const NEWCOMER = "e2e-streak-newcomer@backend.com.br";
const EMAILS = [WALKER, NEWCOMER];

describe("Streak (e2e)", () => {
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

  const streak = (token: string) =>
    request(app.getHttpServer())
      .get("/me/streak")
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

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Streak Co", slug: SLUG },
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

    // O caminhante abre o dia (registra o humor de hoje).
    await request(app.getHttpServer())
      .post("/me/today/mood")
      .set("Authorization", `Bearer ${walkerToken}`)
      .send({ mood: 4 });
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("refuses an anonymous request", async () => {
    await request(app.getHttpServer()).get("/me/streak").expect(401);
  });

  it("counts today as a one-day streak once the day is open", async () => {
    const response = await streak(walkerToken).expect(200);

    expect(response.body.currentStreak).toBe(1);
    expect(response.body.longestStreak).toBeGreaterThanOrEqual(1);
    expect(response.body.week).toHaveLength(7);
    // O dia de hoje aparece como feito na semana.
    expect(
      response.body.week.some((d: { state: string }) => d.state === "done"),
    ).toBe(true);
    // A proteção da semana está disponível quando nada precisou ser coberto.
    expect(response.body.freezesAvailable).toBe(1);
    expect(response.body.freezeApplied).toBe(false);
  });

  it("shows zero for a newcomer with no entries", async () => {
    const response = await streak(newcomerToken).expect(200);
    expect(response.body.currentStreak).toBe(0);
    expect(response.body.longestStreak).toBe(0);
    expect(response.body.week).toHaveLength(7);
  });

  it("does not leak another person's streak between companies", async () => {
    const mine = await streak(walkerToken).expect(200);
    const theirs = await streak(newcomerToken).expect(200);
    expect(mine.body.currentStreak).toBe(1);
    expect(theirs.body.currentStreak).toBe(0);
  });

  it("returns nothing that identifies the person", async () => {
    const response = await streak(walkerToken).expect(200);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain("userId");
    expect(body).not.toContain(WALKER);
  });
});
