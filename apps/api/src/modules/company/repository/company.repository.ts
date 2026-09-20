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
            updatedAt: company.updatedAt,
            deletedAt: company.deletedAt,
          },
        }),
      "slug",
      slugAlreadyInUse,
    );
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
    ]);

    return {
      active,
      declarers,
      tightDeclarers,
      moodPeople,
      averageMood: mood._avg.mood,
      entries: entryCount,
      supportUses,
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
