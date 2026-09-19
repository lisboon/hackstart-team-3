import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
