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
  SavingsGoalKind,
  SavingsGoalStatus,
  SavingsGoalUnmetReason,
  SelfReportSituation,
  UserRole,
} from "../src/modules/@shared/domain/enums";

const PASSWORD = "Sup3rSecret!";
const SLUG_A = "e2e-goals-company-a";
const SLUG_B = "e2e-goals-company-b";
const WORKER_A = "e2e-goals-worker-a@backend.com.br";
const WORKER_B = "e2e-goals-worker-b@backend.com.br";
const EMAILS = [WORKER_A, WORKER_B];

describe("Savings goals (e2e)", () => {
  let app: INestApplication<App>;
  let workerAToken: string;
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
    companyId: string,
  ): Promise<void> => {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: email,
        email,
        password: await bcrypt.hash(PASSWORD, 10),
        role: UserRole.USER,
        companyId,
      },
    });
  };

  const goals = (token: string) =>
    request(app.getHttpServer())
      .get("/me/goals")
      .set("Authorization", `Bearer ${token}`);

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
      data: { id: randomUUID(), name: "Goals A", slug: SLUG_A },
    });
    const companyB = await prisma.company.create({
      data: { id: randomUUID(), name: "Goals B", slug: SLUG_B },
    });
    companyAId = companyA.id;
    companyBId = companyB.id;

    await createUser(WORKER_A, companyAId);
    await createUser(WORKER_B, companyBId);

    workerAToken = await login(WORKER_A);
    workerBToken = await login(WORKER_B);
  });

  afterAll(async () => {
    await prisma.savingsGoal.deleteMany({
      where: { companyId: { in: [companyAId, companyBId] } },
    });
    await prisma.selfReport.deleteMany({
      where: { companyId: { in: [companyAId, companyBId] } },
    });
    await prisma.auditEvent.deleteMany({
      where: { companyId: { in: [companyAId, companyBId] } },
    });
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({
      where: { id: { in: [companyAId, companyBId] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it("refuses an unauthenticated request", async () => {
    await request(app.getHttpServer()).get("/me/goals").expect(401);
    await request(app.getHttpServer())
      .post("/me/goals")
      .send({ kind: SavingsGoalKind.MONTHLY, targetAmountCents: 20000 })
      .expect(401);
  });

  it("rejects identity sent in the body, using the session", async () => {
    await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({
        kind: SavingsGoalKind.MONTHLY,
        userId: randomUUID(),
        companyId: companyBId,
      })
      .expect(422);
  });

  it("rejects an enduring goal without a term, and a monthly with one", async () => {
    await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ kind: SavingsGoalKind.ENDURING, targetAmountCents: 60000 })
      .expect(422);
  });

  it("creates a monthly goal and, once the month is declared in the blue, marks it met", async () => {
    const created = await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ kind: SavingsGoalKind.MONTHLY, targetAmountCents: 20000 })
      .expect(201);
    expect(created.body.kind).toBe(SavingsGoalKind.MONTHLY);
    expect(created.body.targetMonths).toBeNull();

    // Antes de declarar, o mês corrente ainda não está cumprido.
    const before = await goals(workerAToken).expect(200);
    const goalBefore = before.body.goals.find(
      (g: { id: string }) => g.id === created.body.id,
    );
    expect(goalBefore.currentMonthMet).toBe(false);

    // Declara o mês corrente como SURPLUS: o cumprimento deriva daqui.
    await request(app.getHttpServer())
      .post("/me/self-report")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ situation: SelfReportSituation.SURPLUS })
      .expect(201);

    const after = await goals(workerAToken).expect(200);
    const goalAfter = after.body.goals.find(
      (g: { id: string }) => g.id === created.body.id,
    );
    expect(goalAfter.monthsMet).toBe(1);
    expect(goalAfter.currentMonthMet).toBe(true);
    expect(goalAfter.status).toBe(SavingsGoalStatus.MET);
  });

  it("creates an enduring goal, shows X of N, and extends the term", async () => {
    const created = await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({
        kind: SavingsGoalKind.ENDURING,
        targetAmountCents: 60000,
        targetMonths: 3,
      })
      .expect(201);
    expect(created.body.targetMonths).toBe(3);
    expect(created.body.targetAmountCents).toBe(60000);

    const listed = await goals(workerAToken).expect(200);
    const view = listed.body.goals.find(
      (g: { id: string }) => g.id === created.body.id,
    );
    expect(view.targetMonths).toBe(3);
    expect(view.monthsMet).toBeGreaterThanOrEqual(0);
    // O alvo mensal é o total dividido pelos meses: 60000 / 3 = 20000.
    expect(view.targetAmountCents).toBe(60000);
    expect(view.monthlyTargetCents).toBe(20000);

    const extended = await request(app.getHttpServer())
      .patch(`/me/goals/${created.body.id}`)
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({ action: "EXTEND", targetMonths: 6 })
      .expect(200);
    expect(extended.body.targetMonths).toBe(6);
  });

  it("ends a goal with a closed reason that never leaves the personal resource", async () => {
    const created = await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({
        kind: SavingsGoalKind.ENDURING,
        targetAmountCents: 60000,
        targetMonths: 4,
      })
      .expect(201);

    const ended = await request(app.getHttpServer())
      .patch(`/me/goals/${created.body.id}`)
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({
        action: "END",
        unmetReason: SavingsGoalUnmetReason.UNEXPECTED_EXPENSE,
      })
      .expect(200);
    expect(ended.body.status).toBe(SavingsGoalStatus.ENDED);

    // O motivo é privado: a lista da própria pessoa nem devolve o campo, e
    // nada nele escapa para outro recurso.
    const listed = await goals(workerAToken).expect(200);
    const body = JSON.stringify(listed.body);
    expect(body).not.toContain("unmetReason");
    expect(body).not.toContain(SavingsGoalUnmetReason.UNEXPECTED_EXPENSE);
  });

  it("rejects extending a goal that belongs to another company", async () => {
    const created = await request(app.getHttpServer())
      .post("/me/goals")
      .set("Authorization", `Bearer ${workerAToken}`)
      .send({
        kind: SavingsGoalKind.ENDURING,
        targetAmountCents: 60000,
        targetMonths: 3,
      })
      .expect(201);

    // A pessoa da empresa B não alcança a meta da empresa A: 404, não 200.
    await request(app.getHttpServer())
      .patch(`/me/goals/${created.body.id}`)
      .set("Authorization", `Bearer ${workerBToken}`)
      .send({ action: "EXTEND", targetMonths: 6 })
      .expect(404);
  });

  it("keeps goals isolated between companies", async () => {
    const listed = await goals(workerBToken).expect(200);
    // A empresa B nunca criou meta: a lista dela é vazia, sem ver as de A.
    expect(listed.body.goals).toEqual([]);
  });
});
