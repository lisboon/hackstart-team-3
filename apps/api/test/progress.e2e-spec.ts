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
const SLUG = "e2e-progress-company";
const WORKER = "e2e-progress-worker@backend.com.br";
const NEWCOMER = "e2e-progress-newcomer@backend.com.br";

const monthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

const dayOfMonth = (offset: number) => {
  const start = monthStart();
  return new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1 + offset),
  );
};

describe("Monthly progress (e2e)", () => {
  let app: INestApplication<App>;
  let token: string;
  let newcomerToken: string;
  let companyId: string;
  let userId: string;

  const login = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken as string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({
      where: { email: { in: [WORKER, NEWCOMER] } },
    });
    await prisma.company.deleteMany({ where: { slug: SLUG } });

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Progress Co", slug: SLUG },
    });
    companyId = company.id;

    const hash = await bcrypt.hash(PASSWORD, 10);
    const worker = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: WORKER,
        email: WORKER,
        password: hash,
        role: UserRole.USER,
        companyId,
      },
    });
    userId = worker.id;

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: NEWCOMER,
        email: NEWCOMER,
        password: hash,
        role: UserRole.USER,
        companyId,
      },
    });

    // Dias 1, 3 e 4 do mês corrente. A data é a chave do dia, e o mês é o do
    // relógio do servidor — nenhum dos dois vem do cliente.
    await prisma.dailyEntry.createMany({
      data: [0, 2, 3].map((offset) => ({
        id: randomUUID(),
        userId,
        companyId,
        entryDate: dayOfMonth(offset),
        mood: 4,
      })),
    });

    token = await login(WORKER);
    newcomerToken = await login(NEWCOMER);
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({
      where: { email: { in: [WORKER, NEWCOMER] } },
    });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("refuses an anonymous request", async () => {
    await request(app.getHttpServer()).get("/me/progress").expect(401);
  });

  it("returns the days of the current month that have an entry", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/progress")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.month).toBe(monthStart().toISOString());
    expect(response.body.days).toEqual([1, 3, 4]);
    expect(response.body.total).toBe(3);
    expect(response.body.daysInMonth).toBeGreaterThanOrEqual(28);
  });

  it("gives a newcomer an empty month, not a failure", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/progress")
      .set("Authorization", `Bearer ${newcomerToken}`)
      .expect(200);

    expect(response.body.days).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it("never leaks another person's days", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/progress")
      .set("Authorization", `Bearer ${newcomerToken}`)
      .expect(200);

    // O colega da mesma empresa tem três dias; o recém-chegado não vê nenhum.
    expect(response.body.total).toBe(0);
  });

  it("returns nothing that identifies a person", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/progress")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain(userId);
    expect(body).not.toContain(companyId);
    expect(body).not.toContain(WORKER);
  });
});
