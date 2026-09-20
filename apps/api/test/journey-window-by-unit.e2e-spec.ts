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
const CUIABA = {
  slug: "e2e-unidade-cuiaba",
  email: "e2e-cuiaba-worker@backend.com.br",
  zone: "America/Cuiaba",
};
const BELEM = {
  slug: "e2e-unidade-belem",
  email: "e2e-belem-worker@backend.com.br",
  zone: "America/Belem",
};

/** A mesma jornada, todos os dias: 07:30 às 18:00 no relógio da unidade. */
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  opensAt: 7 * 60 + 30,
  closesAt: 18 * 60,
}));

/** A hora de parede que um instante marca naquele fuso. */
const wallClockIn = (zone: string, iso: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));

/**
 * A #76 em uma frase: a mesma janela, em duas unidades de fusos diferentes,
 * são dois instantes diferentes. Cuiabá é UTC−4 e Belém é UTC−3 — com
 * `America/Cuiaba` fixo para todo mundo, a janela abria uma hora mais tarde
 * para metade da área de atuação da cooperativa.
 */
describe("Journey window per unit (e2e)", () => {
  let app: INestApplication<App>;
  const companyIds: string[] = [];
  const tokens: Record<string, string> = {};

  const seed = async (unit: typeof CUIABA) => {
    await prisma.user.deleteMany({ where: { email: unit.email } });
    await prisma.company.deleteMany({ where: { slug: unit.slug } });

    const company = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: unit.slug,
        slug: unit.slug,
        journeyZone: unit.zone,
        journeyShifts: { create: EVERY_DAY },
      },
    });
    companyIds.push(company.id);

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: unit.email,
        email: unit.email,
        password: await bcrypt.hash(PASSWORD, 10),
        role: UserRole.USER,
        companyId: company.id,
      },
    });

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: unit.email, password: PASSWORD });
    tokens[unit.slug] = login.body.accessToken;
  };

  const windowOf = async (unit: typeof CUIABA) => {
    const response = await request(app.getHttpServer())
      .get("/me/today")
      .set("Authorization", `Bearer ${tokens[unit.slug]}`)
      .expect(200);
    return response.body.window as {
      open: boolean;
      opensAt: string;
      closesAt: string;
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await seed(CUIABA);
    await seed(BELEM);
  });

  afterAll(async () => {
    await prisma.dailyEntry.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [CUIABA.email, BELEM.email] } },
    });
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  it("opens at 07:30 on each unit's own clock", async () => {
    const cuiaba = await windowOf(CUIABA);
    const belem = await windowOf(BELEM);

    expect(wallClockIn(CUIABA.zone, cuiaba.opensAt)).toBe("07:30");
    expect(wallClockIn(BELEM.zone, belem.opensAt)).toBe("07:30");
  });

  it("turns that same wall clock into two different instants", async () => {
    const cuiaba = await windowOf(CUIABA);
    const belem = await windowOf(BELEM);

    // É a hora que faltava ao Pará. Se os dois instantes coincidissem, a
    // janela ainda seria do processo, não da unidade.
    expect(cuiaba.opensAt).not.toBe(belem.opensAt);
  });

  it("closes at 18:00 on each unit's own clock", async () => {
    const cuiaba = await windowOf(CUIABA);
    const belem = await windowOf(BELEM);

    expect(wallClockIn(CUIABA.zone, cuiaba.closesAt)).toBe("18:00");
    expect(wallClockIn(BELEM.zone, belem.closesAt)).toBe("18:00");
  });
});
