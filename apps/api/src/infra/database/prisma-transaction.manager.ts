import { Logger, LoggerService } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  TransactionManager,
  TransactionContext,
  TransactionOptions,
} from "@/modules/@shared/domain/transaction/transaction-manager.interface";
import { PrismaTransactionContext } from "./prisma-transaction.context";
import { isTransactionWriteConflict } from "./prisma-error.inspector";

interface PrismaTransactionManagerOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  logger?: LoggerService;
}

/**
 * Seis tentativas com base de 50ms: no pior caso algo em torno de três
 * segundos somando o jitter, contra os 400ms de antes. Não muda semântica, só
 * dá espaço para a contenção resolver — e o caminho que mais colidia agora
 * entra em fila antes de decidir, então isto é rede, não plano principal.
 */
const DEFAULT_MAX_RETRIES = 6;
const DEFAULT_RETRY_DELAY_MS = 50;

export class PrismaTransactionManager implements TransactionManager {
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaClient,
    options: PrismaTransactionManagerOptions = {},
  ) {
    this.maxRetries = this.normalizeOption(
      options.maxRetries,
      DEFAULT_MAX_RETRIES,
      true,
    );
    this.retryDelayMs = this.normalizeOption(
      options.retryDelayMs,
      DEFAULT_RETRY_DELAY_MS,
    );
    this.logger = options.logger ?? new Logger(PrismaTransactionManager.name);
  }

  async execute<T>(
    fn: (trx: TransactionContext) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    const prismaOptions = options?.isolationLevel
      ? {
          isolationLevel:
            Prisma.TransactionIsolationLevel[options.isolationLevel],
        }
      : undefined;
    let retry = 0;

    while (true) {
      try {
        return await this.prisma.$transaction(
          async (tx) => fn(new PrismaTransactionContext(tx)),
          prismaOptions,
        );
      } catch (error) {
        if (!isTransactionWriteConflict(error)) throw error;
        if (retry >= this.maxRetries) {
          // Quando o orçamento acaba, quem chamou recebe o erro do driver no
          // lugar da regra de negócio. Registrar quantas tentativas foram
          // gastas é o que transforma a hipótese em dado — contagem, nunca
          // teor.
          this.logger.warn({
            message: "Transaction retry budget exhausted",
            attempts: retry + 1,
            maxRetries: this.maxRetries,
            isolationLevel: options?.isolationLevel,
          });
          throw error;
        }

        const exponentialDelay = this.retryDelayMs * 2 ** retry;
        const jitter = exponentialDelay * Math.random();
        await this.wait(exponentialDelay + jitter);
        retry += 1;
      }
    }
  }

  private async wait(delayMs: number): Promise<void> {
    if (delayMs === 0) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private normalizeOption(
    value: number | undefined,
    fallback: number,
    integer = false,
  ): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value)) return fallback;
    const normalized = Math.max(0, value);
    return integer ? Math.trunc(normalized) : normalized;
  }
}
