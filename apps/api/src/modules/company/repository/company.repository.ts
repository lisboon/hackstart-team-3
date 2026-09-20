import { PrismaClient } from "@prisma/client";
import { CompanyGateway } from "../gateway/company.gateway";
import {
  UnitPeriod,
  UnitPopulation,
  UnitTally,
} from "../domain/unit-indicators";
import {
  SUPPORT_OPENED_ACTION,
  SelfReportSituation,
  UserRole,
} from "@/modules/@shared/domain/enums";
import { Company } from "../domain/company.entity";
import {
  JourneyExceptionView,
  JourneyShift,
  JourneyWindow,
} from "../domain/journey-window";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { normalizeSlug } from "@/modules/@shared/domain/utils/slug";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { CompanyModelMapper } from "./company.model.mapper";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { executeWithUniqueConstraintTranslation } from "@/infra/database/prisma-operation";

const SHORTFALL = [
  SelfReportSituation.SLIGHT_SHORTFALL,
  SelfReportSituation.SEVERE_SHORTFALL,
];

/**
 * O painel mede quem percorre a jornada. Contar administradores e editores
 * infla o denominador da adesão com gente que nunca teve a tela do dia.
 */
const member = (companyId: string) => ({
  companyId,
  role: UserRole.USER,
  active: true,
  deletedAt: null,
});

/**
 * A coluna é `DATE`, e o driver a devolve como meia-noite UTC. Recortar os dez
 * primeiros caracteres é o caminho mais curto de volta ao dia do calendário,
 * sem passar por fuso local nenhum.
 */
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const slugAlreadyInUse = () =>
  new EntityValidationError([
    { field: "slug", message: "Slug already in use" },
  ]);

export default class CompanyRepository implements CompanyGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    trx?: TransactionContext,
  ): Promise<Company | null> {
    const row = await resolvePrismaClient(this.prisma, trx).company.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? CompanyModelMapper.toEntity(row) : null;
  }

  async findBySlug(
    slug: string,
    trx?: TransactionContext,
  ): Promise<Company | null> {
    const row = await resolvePrismaClient(this.prisma, trx).company.findFirst({
      where: { slug: normalizeSlug(slug), deletedAt: null },
    });
    return row ? CompanyModelMapper.toEntity(row) : null;
  }

  async create(company: Company, trx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await executeWithUniqueConstraintTranslation(
      () =>
        client.company.create({
          data: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            active: company.active,
            journeyZone: company.journeyZone,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          },
        }),
      "slug",
      slugAlreadyInUse,
    );
  }

  async update(company: Company, trx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await executeWithUniqueConstraintTranslation(
      () =>
        client.company.update({
          where: { id: company.id },
          data: {
            name: company.name,
            slug: company.slug,
            active: company.active,
            journeyZone: company.journeyZone,
            updatedAt: company.updatedAt,
            deletedAt: company.deletedAt,
          },
        }),
      "slug",
      slugAlreadyInUse,
    );
  }

  async findJourneyWindow(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<JourneyWindow | null> {
    const row = await resolvePrismaClient(this.prisma, trx).company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: {
        journeyZone: true,
        journeyShifts: {
          select: { weekday: true, opensAt: true, closesAt: true },
        },
        journeyExceptions: { select: { date: true } },
      },
    });

    // Sem faixa nenhuma a unidade não é "sempre fechada": é uma unidade que
    // nunca configurou a janela, e quem chama aplica o padrão. Exceção sem
    // faixa não muda isso — um feriado não descreve um expediente.
    if (!row || row.journeyShifts.length === 0) return null;
    return {
      zone: row.journeyZone,
      shifts: row.journeyShifts,
      exceptions: row.journeyExceptions.map((exception) =>
        toIsoDate(exception.date),
      ),
    };
  }

  async replaceJourneyShifts(
    companyId: string,
    shifts: readonly JourneyShift[],
    trx?: TransactionContext,
  ): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await client.companyJourneyShift.deleteMany({ where: { companyId } });
    if (shifts.length === 0) return;
    await client.companyJourneyShift.createMany({
      data: shifts.map((shift) => ({ companyId, ...shift })),
    });
  }

  async findJourneyExceptions(
    companyId: string,
    trx?: TransactionContext,
  ): Promise<JourneyExceptionView[]> {
    const rows = await resolvePrismaClient(
      this.prisma,
      trx,
    ).companyJourneyException.findMany({
      where: { companyId },
      orderBy: { date: "asc" },
      select: { date: true, reason: true },
    });
    return rows.map((row) => ({
      date: toIsoDate(row.date),
      reason: row.reason,
    }));
  }

  async replaceJourneyExceptions(
    companyId: string,
    exceptions: readonly JourneyExceptionView[],
    trx?: TransactionContext,
  ): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await client.companyJourneyException.deleteMany({ where: { companyId } });
    if (exceptions.length === 0) return;
    await client.companyJourneyException.createMany({
      data: exceptions.map((exception) => ({
        companyId,
        date: new Date(`${exception.date}T00:00:00.000Z`),
        reason: exception.reason,
      })),
    });
  }

  async findTally(companyId: string, period: UnitPeriod): Promise<UnitTally> {
    const window = { gte: period.from, lt: period.to };
    const reports = { companyId, deletedAt: null, referenceMonth: window };
    const entries = { companyId, deletedAt: null, entryDate: window };
    // O humor só conta quando a pessoa o declarou: o neutro automático, aberto
    // pela colheita, não é declaração e não pode puxar a média do gestor.
    const declaredMood = { ...entries, moodDeclared: true };
    const unit = member(companyId);

    // Cada indicador vem com o tamanho da própria população, porque é ela que
    // decide se ele pode ser publicado. Tudo contado no banco: nenhuma linha
    // individual sobe para a memória.
    const [
      active,
      declarers,
      tightDeclarers,
      moodPeople,
      mood,
      entryCount,
      supportUses,
      accessRows,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          ...unit,
          OR: [
            { dailyEntries: { some: entries } },
            { selfReports: { some: reports } },
          ],
        },
      }),
      this.prisma.user.count({
        where: { ...unit, selfReports: { some: reports } },
      }),
      this.prisma.user.count({
        where: {
          ...unit,
          selfReports: { some: { ...reports, situation: { in: SHORTFALL } } },
        },
      }),
      this.prisma.user.count({
        where: { ...unit, dailyEntries: { some: declaredMood } },
      }),
      this.prisma.dailyEntry.aggregate({
        _avg: { mood: true },
        where: declaredMood,
      }),
      this.prisma.dailyEntry.count({ where: declaredMood }),
      // Os eventos de apoio não guardam ator, então contar é tudo o que dá
      // para fazer com eles — e é tudo o que o painel precisa.
      this.prisma.auditEvent.count({
        where: {
          companyId,
          action: SUPPORT_OPENED_ACTION,
          createdAt: window,
        },
      }),
      // `@@unique([userId, entryDate])` garante uma linha por pessoa por dia,
      // então a contagem do dia já é gente, não visita.
      this.prisma.dailyEntry.groupBy({
        by: ["entryDate"],
        where: entries,
        _count: { _all: true },
        orderBy: { entryDate: "asc" },
      }),
    ]);

    return {
      active,
      declarers,
      tightDeclarers,
      moodPeople,
      averageMood: mood._avg.mood,
      entries: entryCount,
      supportUses,
      accessSeries: accessRows.map((row) => ({
        date: row.entryDate,
        people: row._count._all,
      })),
    };
  }

  async countPopulation(companyId: string): Promise<UnitPopulation> {
    const [headcount, reach] = await Promise.all([
      this.prisma.user.count({ where: member(companyId) }),
      this.prisma.user.count({
        where: {
          ...member(companyId),
          OR: [
            { dailyEntries: { some: { deletedAt: null } } },
            { selfReports: { some: { deletedAt: null } } },
          ],
        },
      }),
    ]);
    return { headcount, reach };
  }
}
