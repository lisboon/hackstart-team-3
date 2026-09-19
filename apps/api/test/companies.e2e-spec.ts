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
const EMAIL = "e2e-organization-admin@backend.com.br";
const SLUG = "e2e-current-organization";

describe("Current organization (e2e)", () => {
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

    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.company.deleteMany({ where: { slug: SLUG } });
    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "Original Name", slug: SLUG },
    });
    companyId = company.id;
    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Organization Admin",
        email: EMAIL,
        password: await bcrypt.hash(PASSWORD, 10),
        role: UserRole.ADMIN,
        companyId,
      },
    });
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("returns the organization from the authenticated session", async () => {
    const response = await request(app.getHttpServer())
      .get("/organizations/current")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: companyId,
      name: "Original Name",
    });
  });

  it("updates only the organization from the authenticated session", async () => {
    const response = await request(app.getHttpServer())
      .patch("/organizations/current")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(response.body).toMatchObject({
      id: companyId,
      name: "Updated Name",
    });
  });

  it("rejects changing the organization active state", async () => {
    await request(app.getHttpServer())
      .patch("/organizations/current")
      .set("Authorization", `Bearer ${token}`)
      .send({ active: false })
      .expect(422);
  });

  it("does not expose global company administration routes", async () => {
    await request(app.getHttpServer())
      .get("/companies")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
