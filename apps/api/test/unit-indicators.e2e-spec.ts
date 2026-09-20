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
  SUPPORT_OPENED_ACTION,
  SupportResource,
  UserRole,
} from "../src/modules/@shared/domain/enums";
import { MINIMUM_GROUP_SIZE } from "../src/modules/company/domain/unit-indicators";

const PASSWORD = "Sup3rSecret!";
const DOMAIN = "e2e-indicators.com.br";

const now = new Date();
const monthStart = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
);
const entryDate = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
);

/**
 * Unidades lado a lado: uma com gente suficiente, uma abaixo do mínimo e uma
 * com ativos bastantes mas poucos declarantes — é essa terceira que prova a
 * supressão por indicador.
 */
async function seedUnit(
  slug: string,
  workers: number,
  declarers = workers,
  supportOpenings = 0,
) {
  const company = await prisma.company.create({
    data: { id: randomUUID(), name: slug, slug },
  });
  const password = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Admin",
      email: `admin-${slug}@${DOMAIN}`,
      password,
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  for (let i = 0; i < workers; i++) {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: `Worker ${i}`,
        email: `worker-${i}-${slug}@${DOMAIN}`,
        password,
        role: UserRole.USER,
        companyId: company.id,
      },
    });
    await prisma.dailyEntry.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        companyId: company.id,
        entryDate,
        mood: 4,
      },
    });
    if (i < declarers) {
      await prisma.selfReport.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          companyId: company.id,
          referenceMonth: monthStart,
          situation: SelfReportSituation.SEVERE_SHORTFALL,
        },
      });
    }
  }

  // Aberturas de apoio: eventos de auditoria sem ator, contados por unidade.
  // É assim que a rota POST /me/support/opened registra, e é o que o painel
  // soma em supportUses.
  for (let i = 0; i < supportOpenings; i++) {
    await prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        companyId: company.id,
        actorUserId: null,
        action: SUPPORT_OPENED_ACTION,
        resourceType: SupportResource.CRISIS_LINE,
        requestId: null,
        createdAt: entryDate,
      },
    });
  }

  return company.id;
}

describe("Unit indicators (e2e)", () => {
  let app: INestApplication<App>;
  let companyIds: string[];
  let adminToken: string;
  let smallAdminToken: string;
  let mixedAdminToken: string;
  let workerToken: string;

  async function signIn(email: string) {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
    await prisma.company.deleteMany({
      where: { slug: { startsWith: "e2e-indicators-" } },
    });

    companyIds = [
      await seedUnit(
        "e2e-indicators-big",
        MINIMUM_GROUP_SIZE,
        MINIMUM_GROUP_SIZE,
        3,
      ),
      await seedUnit(
        "e2e-indicators-small",
        MINIMUM_GROUP_SIZE - 1,
        MINIMUM_GROUP_SIZE - 1,
        2,
      ),
      await seedUnit("e2e-indicators-mixed", MINIMUM_GROUP_SIZE, 3),
    ];

    adminToken = await signIn(`admin-e2e-indicators-big@${DOMAIN}`);
    smallAdminToken = await signIn(`admin-e2e-indicators-small@${DOMAIN}`);
    mixedAdminToken = await signIn(`admin-e2e-indicators-mixed@${DOMAIN}`);
    workerToken = await signIn(`worker-0-e2e-indicators-big@${DOMAIN}`);
  });

  afterAll(async () => {
    const where = { companyId: { in: companyIds } };
    await prisma.auditEvent.deleteMany({ where });
    await prisma.dailyEntry.deleteMany({ where });
    await prisma.selfReport.deleteMany({ where });
    await prisma.user.deleteMany({ where });
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  it("reports the unit once it has enough people to stay anonymous", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.suppressed).toBe(false);
    expect(response.body.active).toBe(MINIMUM_GROUP_SIZE);
    expect(response.body.averageMood).toBe(4);
    expect(response.body.tightRatio).toBe(1);
    // Três aberturas de apoio semeadas no mês: a unidade tem gente suficiente,
    // então a contagem passa inteira.
    expect(response.body.supportUses).toBe(3);
  });

  it("hides every number when the unit is below the minimum group size", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${smallAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.suppressed).toBe(true);
    // Nada chega ao cliente: a regra não pode ser furada pelo DevTools.
    expect(response.body.active).toBeNull();
    expect(response.body.headcount).toBeNull();
    expect(response.body.averageMood).toBeNull();
    expect(response.body.tightRatio).toBeNull();
    // Duas aberturas foram semeadas nesta unidade, mas abaixo do mínimo nem a
    // contagem de apoio sai: o portão fecha antes de qualquer número.
    expect(response.body.supportUses).toBeNull();
    expect(response.body.previous).toBeNull();
  });

  it("refuses a worker, whose own numbers these are", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${workerToken}`);

    expect(response.status).toBe(403);
  });

  it("counts only the unit in the session, never a neighbouring one", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${adminToken}`);

    // A unidade vizinha tem gente e registros no mesmo mês; se o recorte por
    // empresa falhasse, os dois totais apareceriam somados aqui.
    expect(response.body.headcount).toBe(MINIMUM_GROUP_SIZE);
    expect(response.body.reach).toBe(MINIMUM_GROUP_SIZE);
  });

  it("returns nothing individual, only counts", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${adminToken}`);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("userId");
    expect(body).not.toContain("Worker");
    expect(body).not.toContain(DOMAIN);
  });

  it("hides an indicator whose own population is too small", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current/indicators")
      .set("Authorization", `Bearer ${mixedAdminToken}`);

    // Cinco pessoas registraram humor, mas só três declararam o mês. O painel
    // abre, o humor sai, e a proporção de aperto — que seria uma estatística
    // de três pessoas — não.
    expect(response.body.suppressed).toBe(false);
    expect(response.body.averageMood).toBe(4);
    expect(response.body.tightRatio).toBeNull();
  });
});
