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
const EMAILS = {
  adminA: "e2e-users-admin-a@backend.com.br",
  adminB: "e2e-users-admin-b@backend.com.br",
  member: "e2e-users-member@backend.com.br",
  outsider: "e2e-users-outsider@backend.com.br",
};
const COMPANY_SLUG = "e2e-users-company";
const OTHER_COMPANY_SLUG = "e2e-users-other-company";

jest.setTimeout(15_000);

describe("Users (e2e)", () => {
  let app: INestApplication<App>;
  let companyId: string;
  let adminAId: string;
  let adminBId: string;
  let adminAToken: string;
  let memberToken: string;
  let otherCompanyId: string;
  let outsiderId: string;

  const seedUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: email,
        email,
        password: await bcrypt.hash(PASSWORD, 10),
        role,
        companyId,
      },
    });
    return user.id;
  };

  const login = async (email: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: PASSWORD });
    return res.body.accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await prisma.user.deleteMany({
      where: { email: { in: Object.values(EMAILS) } },
    });
    await prisma.company.deleteMany({
      where: { slug: { in: [COMPANY_SLUG, OTHER_COMPANY_SLUG] } },
    });

    const company = await prisma.company.create({
      data: { id: randomUUID(), name: "E2E Users Company", slug: COMPANY_SLUG },
    });
    companyId = company.id;

    const otherCompany = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: "E2E Other Company",
        slug: OTHER_COMPANY_SLUG,
      },
    });
    otherCompanyId = otherCompany.id;

    adminAId = await seedUser(EMAILS.adminA, UserRole.ADMIN);
    adminBId = await seedUser(EMAILS.adminB, UserRole.ADMIN);
    await seedUser(EMAILS.member, UserRole.USER);
    outsiderId = await prisma.user
      .create({
        data: {
          id: randomUUID(),
          name: "Outside Admin",
          email: EMAILS.outsider,
          password: await bcrypt.hash(PASSWORD, 10),
          role: UserRole.ADMIN,
          companyId: otherCompanyId,
        },
      })
      .then((user) => user.id);

    adminAToken = await login(EMAILS.adminA);
    memberToken = await login(EMAILS.member);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: Object.values(EMAILS) } },
    });
    await prisma.company.deleteMany({
      where: { slug: { in: [COMPANY_SLUG, OTHER_COMPANY_SLUG] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it("forbids a non-admin (USER) from listing users (403)", async () => {
    await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(403);
  });

  it("rejects listing users without authentication (401)", async () => {
    await request(app.getHttpServer()).get("/users").expect(401);
  });

  it("rejects an invalid user id at the HTTP boundary (422)", async () => {
    await request(app.getHttpServer())
      .get("/users/not-a-uuid")
      .set("Authorization", `Bearer ${adminAToken}`)
      .expect(422);
  });

  it("lists only users from the authenticated company", async () => {
    const response = await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${adminAToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(3);
    expect(response.body.items).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ id: outsiderId })]),
    );
  });

  it.each(["get", "patch", "delete"] as const)(
    "returns 404 when an admin tries to %s a user from another company",
    async (method) => {
      const call = request(app.getHttpServer())
        [method](`/users/${outsiderId}`)
        .set("Authorization", `Bearer ${adminAToken}`);
      if (method === "patch") {
        call.send({ name: "Cross-tenant change" });
      }
      await call.expect(404);
    },
  );

  it("derives the company when creating a user", async () => {
    const email = "e2e-users-created@backend.com.br";
    const response = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${adminAToken}`)
      .send({
        name: "Created Member",
        email,
        password: PASSWORD,
        role: UserRole.USER,
      })
      .expect(201);

    expect(response.body.companyId).toBe(companyId);
    await prisma.user.delete({ where: { email } });
  });

  it("allows an admin to delete another admin while others remain (200)", async () => {
    await request(app.getHttpServer())
      .delete(`/users/${adminBId}`)
      .set("Authorization", `Bearer ${adminAToken}`)
      .expect(200);
  });

  it("forbids deleting the last active admin (403)", async () => {
    await request(app.getHttpServer())
      .delete(`/users/${adminAId}`)
      .set("Authorization", `Bearer ${adminAToken}`)
      .expect(403);
  });
});
