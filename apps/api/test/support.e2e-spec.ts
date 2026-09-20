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
  SUPPORT_OPENED_ACTION,
  SupportResource,
  UserRole,
} from "../src/modules/@shared/domain/enums";

const PASSWORD = "Sup3rSecret!";
const SLUG = "e2e-support-company";
const OTHER_SLUG = "e2e-support-other-company";
const WORKER = "e2e-support-worker@backend.com.br";
const EMAILS = [WORKER];

describe("Support (e2e)", () => {
  let app: INestApplication<App>;
  let workerToken: string;
  let companyId: string;
  let otherCompanyId: string;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return response.body.accessToken;
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
      where: { slug: { in: [SLUG, OTHER_SLUG] } },
    });

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Support Company", slug: SLUG },
    });
    companyId = company.id;

    // Uma unidade vizinha, sem sessão nossa: existe só para provar que a
    // contagem de apoio nunca atravessa a fronteira da empresa.
    const otherCompany = await prisma.company.create({
      data: { id: randomUUID(), name: "Other Company", slug: OTHER_SLUG },
    });
    otherCompanyId = otherCompany.id;

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

    workerToken = await login(WORKER);
  });

  afterEach(async () => {
    // Cada teste conta a partir do zero: a contagem por unidade é justamente o
    // que estamos exercitando, então nenhum evento pode vazar de um caso para
    // o seguinte.
    await prisma.auditEvent.deleteMany({
      where: { companyId: { in: [companyId, otherCompanyId] } },
    });
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({
      where: { companyId: { in: [companyId, otherCompanyId] } },
    });
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
    await prisma.company.deleteMany({
      where: { id: { in: [companyId, otherCompanyId] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated open", async () => {
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .send({ resource: SupportResource.CRISIS_LINE })
      .expect(401);
  });

  it("counts the open and echoes only the resource", async () => {
    const response = await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ resource: SupportResource.CRISIS_LINE })
      .expect(201);

    expect(response.body).toEqual({ resource: SupportResource.CRISIS_LINE });
  });

  it("records the event for the unit without recording who opened it", async () => {
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ resource: SupportResource.SUPPORT_DIRECTORY })
      .expect(201);

    const events = await prisma.auditEvent.findMany({
      where: { companyId, action: SUPPORT_OPENED_ACTION },
    });

    expect(events).toHaveLength(1);
    // A unidade sabe que houve abertura; ninguém sabe de quem. Gravar o ator
    // seria inferir sofrimento de uma pessoa identificada — exatamente o que o
    // produto promete não fazer.
    expect(events[0].actorUserId).toBeNull();
    expect(events[0].resourceType).toBe(SupportResource.SUPPORT_DIRECTORY);
    expect(events[0].companyId).toBe(companyId);
  });

  it("keeps the event anonymous even when the client sends its own request id", async () => {
    // `requestId` nasce de um header controlado pelo cliente. Se ele fosse
    // gravado, alguém poderia mandar ali o próprio identificador e desfazer o
    // anonimato pela porta de trás. Ele vai nulo por decisão, não por acaso.
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .set("x-request-id", randomUUID())
      .send({ resource: SupportResource.CRISIS_LINE })
      .expect(201);

    const event = await prisma.auditEvent.findFirst({
      where: { companyId, action: SUPPORT_OPENED_ACTION },
    });

    expect(event?.requestId).toBeNull();
  });

  it("rejects a resource outside the declared set", async () => {
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ resource: "THERAPIST" })
      .expect(422);
  });

  it("ignores identity sent in the body and refuses the extra field", async () => {
    // O corpo só aceita `resource`. Mandar qualquer identificação é 422,
    // porque não há onde guardá-la — a unidade sai da sessão e o ator não é
    // gravado.
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        resource: SupportResource.CRISIS_LINE,
        actorUserId: randomUUID(),
      })
      .expect(422);

    const stored = await prisma.auditEvent.count({
      where: { companyId, action: SUPPORT_OPENED_ACTION },
    });
    expect(stored).toBe(0);
  });

  it("attributes the open to the session's company, never a neighbouring one", async () => {
    // A empresa sai da sessão, não do corpo. Uma abertura feita pelo worker da
    // empresa A não pode aparecer no contador da empresa B — é a mesma fronteira
    // de tenant que o painel de indicadores respeita.
    await request(app.getHttpServer())
      .post("/me/support/opened")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ resource: SupportResource.CRISIS_LINE })
      .expect(201);

    const mine = await prisma.auditEvent.count({
      where: { companyId, action: SUPPORT_OPENED_ACTION },
    });
    const neighbour = await prisma.auditEvent.count({
      where: { companyId: otherCompanyId, action: SUPPORT_OPENED_ACTION },
    });

    expect(mine).toBe(1);
    expect(neighbour).toBe(0);
  });
});
