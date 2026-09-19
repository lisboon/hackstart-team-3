import { PrismaClient } from "@prisma/client";
import { TransactionContext } from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { resolvePrismaClient } from "@/infra/database/prisma-transaction.context";
import { ContentPiece } from "../domain/content-piece.entity";
import { ContentPieceGateway } from "../gateway/content-piece.gateway";
import { ContentPieceModelMapper } from "./content-piece.model.mapper";

/** A trilha é o COOPS na ordem, e dentro da etapa a ordem declarada na peça. */
const TRACK_ORDER = [
  { stage: "asc" as const },
  { orderInStage: "asc" as const },
];

export default class ContentPieceRepository implements ContentPieceGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    trx?: TransactionContext,
  ): Promise<ContentPiece | null> {
    const row = await resolvePrismaClient(
      this.prisma,
      trx,
    ).contentPiece.findFirst({ where: { id, active: true, deletedAt: null } });
    return row ? ContentPieceModelMapper.toEntity(row) : null;
  }

  async findNext(
    answeredIds: string[],
    trx?: TransactionContext,
  ): Promise<ContentPiece | null> {
    const row = await resolvePrismaClient(
      this.prisma,
      trx,
    ).contentPiece.findFirst({
      where: {
        active: true,
        deletedAt: null,
        id: answeredIds.length ? { notIn: answeredIds } : undefined,
      },
      orderBy: TRACK_ORDER,
    });
    return row ? ContentPieceModelMapper.toEntity(row) : null;
  }
}
