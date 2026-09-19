import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { CONTENT_PIECES, CONTENT_SOURCE_URL } from './content-pieces.seed';
import {
  PITCH_HISTORY,
  UNIT_A_COHORT,
  UNIT_B,
  demoEmail,
  type DemoPerson,
} from './demo.seed';

const DEFAULT_SALT_ROUNDS = 12;

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'USER';
};

function readUser(
  prefix: string,
  fallbackName: string,
  role: SeedUser['role'],
): SeedUser | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !password) return null;

  return {
    email,
    password,
    name: process.env[`${prefix}_NAME`] ?? fallbackName,
    role,
  };
}

const monthStart = (base: Date, monthsBack: number) =>
  new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - monthsBack, 1));

const dayStart = (base: Date, daysBack: number) =>
  new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - daysBack),
  );

type SeededPiece = { id: string; options: unknown };

/** A opção que demonstra compreensão, ou a primeira: histórico plausível, não sorteado. */
function chosenOption(piece: SeededPiece) {
  const options = piece.options as {
    label: string;
    demonstratesComprehension?: boolean;
  }[];
  return options.find((option) => option.demonstratesComprehension) ?? options[0];
}

/**
 * Escreve declarações e dias de uma pessoa. Idempotente pelas chaves únicas
 * `(userId, referenceMonth)` e `(userId, entryDate)`: rodar de novo não duplica
 * nem altera o que já existe.
 *
 * `includeToday` fica falso para a pessoa do pitch, de modo que a apresentação
 * comece na pergunta de humor e o toque aconteça ao vivo.
 */
async function seedPersonHistory(
  prisma: PrismaClient,
  options: {
    userId: string;
    companyId: string;
    person: Omit<DemoPerson, 'name'>;
    today: Date;
    includeToday: boolean;
    trail: SeededPiece[];
  },
) {
  const { userId, companyId, person, today, includeToday, trail } = options;

  const oldestFirst = [...person.situations];
  for (let index = 0; index < oldestFirst.length; index += 1) {
    const referenceMonth = monthStart(today, oldestFirst.length - 1 - index);
    await prisma.selfReport.upsert({
      where: { userId_referenceMonth: { userId, referenceMonth } },
      update: {},
      create: {
        id: randomUUID(),
        userId,
        companyId,
        referenceMonth,
        situation: oldestFirst[index],
      },
    });
  }

  const dayOffset = includeToday ? 0 : 1;
  const answered = Math.min(person.answeredPieces, trail.length);
  for (let index = 0; index < person.moods.length; index += 1) {
    const daysBack = person.moods.length - 1 - index + dayOffset;
    const piece = index < answered ? trail[index] : undefined;
    const option = piece ? chosenOption(piece) : undefined;
    await prisma.dailyEntry.upsert({
      where: {
        userId_entryDate: { userId, entryDate: dayStart(today, daysBack) },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId,
        companyId,
        entryDate: dayStart(today, daysBack),
        mood: person.moods[index],
        contentPieceId: piece?.id ?? null,
        answer: option?.label ?? null,
        comprehended: option ? Boolean(option.demonstratesComprehension) : null,
      },
    });
  }
}

/**
 * Pessoa sintética do agregado. Sem senha utilizável de propósito: ela existe
 * para a unidade ter massa, não para entrar no app.
 */
async function ensureDemoPerson(
  prisma: PrismaClient,
  options: { name: string; companyId: string; rounds: number },
) {
  const email = demoEmail(options.name);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: options.name,
      email,
      password: await bcrypt.hash(randomUUID(), options.rounds),
      role: 'USER',
      companyId: options.companyId,
    },
  });
}

async function main() {
  const admin = readUser('SEED_ADMIN', 'Administrador', 'ADMIN');
  if (!admin) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the first admin.',
    );
  }

  // O colaborador é opcional para não quebrar ambientes existentes, mas sem ele
  // não há como exercitar o isolamento entre pessoas da mesma empresa nem
  // demonstrar as duas visões do produto.
  const worker = readUser('SEED_WORKER', 'Colaborador', 'USER');

  const companyName = process.env.SEED_COMPANY_NAME ?? 'Default Company';
  const companySlug = (process.env.SEED_COMPANY_SLUG ?? 'default')
    .trim()
    .toLowerCase();

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? DEFAULT_SALT_ROUNDS);

  try {
    const company = await prisma.company.upsert({
      where: { slug: companySlug },
      update: {},
      create: { id: randomUUID(), name: companyName, slug: companySlug },
    });
    console.log(`Seed: company "${companySlug}" ready.`);

    for (const user of [admin, worker]) {
      if (!user) continue;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (existing) {
        console.log(`Seed: user "${user.email}" already exists, skipping.`);
        continue;
      }

      await prisma.user.create({
        data: {
          id: randomUUID(),
          name: user.name,
          email: user.email,
          password: await bcrypt.hash(user.password, rounds),
          role: user.role,
          companyId: company.id,
        },
      });
      console.log(`Seed: ${user.role.toLowerCase()} "${user.email}" created.`);
    }
    for (const piece of CONTENT_PIECES) {
      await prisma.contentPiece.upsert({
        where: {
          stage_orderInStage: {
            stage: piece.stage,
            orderInStage: piece.orderInStage,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          stage: piece.stage,
          orderInStage: piece.orderInStage,
          title: piece.title,
          body: piece.body,
          prompt: piece.prompt,
          options: piece.options as unknown as object,
          sourceUrl: CONTENT_SOURCE_URL,
        },
      });
    }
    console.log(`Seed: ${CONTENT_PIECES.length} COOPS pieces ready.`);

    // Histórico sintético da demonstração (Anexo V 4.4). Tela vazia mata a
    // apresentação: o painel da unidade precisa de gente com passado.
    const today = new Date();
    const trail = await prisma.contentPiece.findMany({
      where: { deletedAt: null },
      orderBy: [{ stage: 'asc' }, { orderInStage: 'asc' }],
      select: { id: true, options: true },
    });

    // A pessoa do pitch é o colaborador do seed. O histórico depende só do
    // e-mail: quem roda o seed fora do Compose costuma não ter a senha em mão,
    // e ficar sem histórico em silêncio seria descobrir no palco.
    const pitchEmail = process.env.SEED_WORKER_EMAIL?.trim().toLowerCase();
    const pitchPerson = pitchEmail
      ? await prisma.user.findUnique({ where: { email: pitchEmail } })
      : null;
    if (pitchPerson) {
      await seedPersonHistory(prisma, {
        userId: pitchPerson.id,
        companyId: pitchPerson.companyId,
        person: PITCH_HISTORY,
        today,
        includeToday: false,
        trail,
      });
      console.log(
        `Seed: history for "${pitchPerson.email}" ready — today stays open for the live demo.`,
      );
    } else {
      console.log(
        'Seed: no pitch history — set SEED_WORKER_EMAIL to a user that exists.',
      );
    }

    for (const person of UNIT_A_COHORT) {
      const demoPerson = await ensureDemoPerson(prisma, {
        name: person.name,
        companyId: company.id,
        rounds,
      });
      await seedPersonHistory(prisma, {
        userId: demoPerson.id,
        companyId: company.id,
        person,
        today,
        includeToday: true,
        trail,
      });
    }
    console.log(
      `Seed: ${UNIT_A_COHORT.length} demo people in "${companySlug}" — with the seeded worker the unit clears the minimum of five.`,
    );

    const unitB = await prisma.company.upsert({
      where: { slug: UNIT_B.slug },
      update: {},
      create: { id: randomUUID(), name: UNIT_B.name, slug: UNIT_B.slug },
    });
    const unitBManagerEmail = `gestor.${UNIT_B.slug}@demo.invalid`;
    const existingManager = await prisma.user.findUnique({
      where: { email: unitBManagerEmail },
    });
    if (!existingManager) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Gestor da Unidade Sul',
          email: unitBManagerEmail,
          // Mesma senha do admin do seed: quem apresenta já a conhece, e é
          // preciso entrar como gestor desta unidade para ver a supressão.
          password: await bcrypt.hash(admin.password, rounds),
          role: 'ADMIN',
          companyId: unitB.id,
        },
      });
    }
    for (const person of UNIT_B.cohort) {
      const demoPerson = await ensureDemoPerson(prisma, {
        name: person.name,
        companyId: unitB.id,
        rounds,
      });
      await seedPersonHistory(prisma, {
        userId: demoPerson.id,
        companyId: unitB.id,
        person,
        today,
        includeToday: true,
        trail,
      });
    }
    console.log(
      `Seed: ${UNIT_B.cohort.length} demo people in "${UNIT_B.slug}" — below five on purpose, so the panel suppresses it.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
