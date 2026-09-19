import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/infra/http/app.module";
import { configureApp } from "../src/infra/http/app.setup";
import prisma from "../src/infra/database/prisma.instance";
import {
  SelfReportSituation,
  UserRole,
} from "../src/modules/@shared/domain/enums";

const PASSWORD = "Sup3rSecret!";
const SLUG_A = "e2e-self-report-company-a";
const SLUG_B = "e2e-self-report-company-b";
const WORKER_A = "e2e-self-report-worker-a@backend.com.br";
const ADMIN_A = "e2e-self-report-admin-a@backend.com.br";
const WORKER_B = "e2e-self-report-worker-b@backend.com.br";
const EMAILS = [WORKER_A, ADMIN_A, WORKER_B];

describe("Self reports (e2e)", () => {
  let app: INestApplication<App>;
  let workerAToken: string;
  let adminAToken: string;
  let workerBToken: string;
  let companyAId: string;
  let companyBId: string;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken;
  };

  const createUser = async (
    email: string,
    role: UserRole,
    companyId: string,
  ): Promise<void> => {
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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({
      where: { slug: { in: [SLUG_A, SLUG_B] } },
    });

    const companyA = await prisma.company.create({
      data: { id: randomUUID(), name: "Company A", slug: SLUG_A },
    });
    const companyB = await prisma.company.create({
      data: { id: randomUUID(), name: "Company B", slug: SLUG_B },
    });
    companyAId = companyA.id;
    companyBId = companyB.id;

    await createUser(WORKER_A, UserRole.USER, companyAId);
    await createUser(ADMIN_A, UserRole.ADMIN, companyAId);
    await createUser(WORKER_B, UserRole.USER, companyBId);

    workerAToken = await login(WORKER_A);
    adminAToken = await login(ADMIN_A);
    workerBToken = await login(WORKER_B);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({
      where: { id: { in: [companyAId, companyBId] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated declaration", async () => {
    await request(app.getHttpServer())
      .post("/me/self-report")
      .send({ situation: SelfReportSituation.SURPLUS })
      .expect(401);
  });

  it("records the declaration for the current month", async () => {
    const response = await request(app.getHttpServer())
      .post("/me/self-report")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ situation: SelfReportSituation.SLIGHT_SHORTFALL })
      .expect(201);

    expect(response.body.situation).toBe(SelfReportSituation.SLIGHT_SHORTFALL);
    expect(new Date(response.body.referenceMonth).getUTCDate()).toBe(1);
  });

  it("corrects the month instead of creating a second declaration", async () => {
    await request(app.getHttpServer())
      .post("/me/self-report")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ situation: SelfReportSituation.SURPLUS })
      .expect(201);

    const stored = await prisma.selfReport.count({
      where: { companyId: companyAId },
    });
    expect(stored).toBe(1);
  });

  it("rejects a situation outside the declared scale", async () => {
    await request(app.getHttpServer())
      .post("/me/self-report")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ situation: "SOMEWHAT" })
      .expect(422);
  });

  it("ignores identity sent in the body and uses the session", async () => {
    await request(app.getHttpServer())
      .post("/me/self-report")
      .set("Authorization", `Bearer ${workerBToken}`)
      .send({
        situation: SelfReportSituation.BREAK_EVEN,
        userId: randomUUID(),
        companyId: companyAId,
      })
      .expect(422);
  });

  it("returns the summary of the person who is logged in", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/summary")
      .set("Authorization", `Bearer ${workerAToken}`)
      .expect(200);

    expect(response.body.currentSituation).toBe(SelfReportSituation.SURPLUS);
    expect(response.body.recentAverage).toBe(3);
    expect(response.body.declaredMonths).toBe(1);
  });

  it("never leaks another person's declaration to an ADMIN of the same company", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/summary")
      .set("Authorization", `Bearer ${adminAToken}`)
      .expect(200);

    // O ADMIN da mesma empresa enxerga a si mesmo, e nada mais: nao existe
    // caminho no contrato que devolva a declaracao de outra pessoa.
    expect(response.body.currentSituation).toBeNull();
    expect(response.body.declaredMonths).toBe(0);
  });

  it("keeps declarations isolated between companies", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/summary")
      .set("Authorization", `Bearer ${workerBToken}`)
      .expect(200);

    expect(response.body.declaredMonths).toBe(0);
  });
});
