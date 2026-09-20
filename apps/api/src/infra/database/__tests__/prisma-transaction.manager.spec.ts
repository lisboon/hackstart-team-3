import { Prisma, type PrismaClient } from "@prisma/client";
import { PrismaTransactionContext } from "../prisma-transaction.context";
import { PrismaTransactionManager } from "../prisma-transaction.manager";

describe("PrismaTransactionManager", () => {
  const transactionClient = { user: {} } as Prisma.TransactionClient;
  const transactionConflict = () =>
    new Prisma.PrismaClientKnownRequestError("Transaction conflict", {
      code: "P2034",
      clientVersion: "7.9.0",
    });
  const silentLogger = () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  });
  const driverAdapterConflict = () =>
    Object.assign(new Error("TransactionWriteConflict"), {
      name: "DriverAdapterError",
      cause: { kind: "TransactionWriteConflict" },
    });

  it("wraps Prisma's client in an opaque transaction context", async () => {
    const transaction = jest.fn(
      async (callback: (client: Prisma.TransactionClient) => Promise<string>) =>
        callback(transactionClient),
    );
    const manager = new PrismaTransactionManager({
      $transaction: transaction,
    } as unknown as PrismaClient);

    const result = await manager.execute(async (context) => {
      expect(context).toBeInstanceOf(PrismaTransactionContext);
      expect((context as PrismaTransactionContext).client).toBe(
        transactionClient,
      );
      return "committed";
    });

    expect(result).toBe("committed");
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), undefined);
  });

  it("maps the core isolation level to Prisma", async () => {
    const transaction = jest.fn(
      async (
        callback: (client: Prisma.TransactionClient) => Promise<void>,
        _options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
      ) => callback(transactionClient),
    );
    const manager = new PrismaTransactionManager({
      $transaction: transaction,
    } as unknown as PrismaClient);

    await manager.execute(async () => undefined, {
      isolationLevel: "Serializable",
    });

    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it("retries the entire transaction after a recoverable conflict", async () => {
    const callback = jest
      .fn()
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockResolvedValueOnce("committed");
    const transaction = jest.fn(
      async (fn: (client: Prisma.TransactionClient) => Promise<string>) =>
        fn(transactionClient),
    );
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { maxRetries: 2, retryDelayMs: 0 },
    );

    await expect(manager.execute(callback)).resolves.toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("allows six retries by default", async () => {
    // Seis, e não quatro: sob contenção o orçamento antigo acabava antes de a
    // disputa se resolver, e quem chamava recebia o erro do driver no lugar
    // da regra de negócio (#68).
    const callback = jest
      .fn()
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockRejectedValueOnce(transactionConflict())
      .mockResolvedValueOnce("committed");
    const transaction = jest.fn(
      async (fn: (client: Prisma.TransactionClient) => Promise<string>) =>
        fn(transactionClient),
    );
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { retryDelayMs: 0 },
    );

    await expect(manager.execute(callback)).resolves.toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(7);
  });

  it("retries write conflicts emitted directly by a Prisma driver adapter", async () => {
    const callback = jest
      .fn()
      .mockRejectedValueOnce(driverAdapterConflict())
      .mockResolvedValueOnce("committed");
    const transaction = jest.fn(
      async (fn: (client: Prisma.TransactionClient) => Promise<string>) =>
        fn(transactionClient),
    );
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { retryDelayMs: 0 },
    );

    await expect(manager.execute(callback)).resolves.toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("rethrows a conflict after exhausting the retry limit", async () => {
    const conflict = transactionConflict();
    const transaction = jest.fn().mockRejectedValue(conflict);
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      // O logger mudo mantem a saida da suite limpa: o aviso do esgotamento
      // tem o teste dele logo acima.
      { maxRetries: 2, retryDelayMs: 0, logger: silentLogger() },
    );

    await expect(manager.execute(async () => undefined)).rejects.toBe(conflict);
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it("records how many attempts it spent when the budget runs out", async () => {
    // A #68 pedia dado em vez de raciocínio: sem isto, um retry esgotado em
    // produção não deixa rastro nenhum. Contagem, nunca teor.
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    const transaction = jest.fn().mockRejectedValue(transactionConflict());
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { maxRetries: 2, retryDelayMs: 0, logger },
    );

    await expect(manager.execute(async () => undefined)).rejects.toBeDefined();

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 3, maxRetries: 2 }),
    );
  });

  it("says nothing while a retry still has budget left", async () => {
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    const callback = jest
      .fn()
      .mockRejectedValueOnce(transactionConflict())
      .mockResolvedValueOnce("committed");
    const transaction = jest.fn(
      async (fn: (client: Prisma.TransactionClient) => Promise<string>) =>
        fn(transactionClient),
    );
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { retryDelayMs: 0, logger },
    );

    await expect(manager.execute(callback)).resolves.toBe("committed");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("does not retry errors that are unrelated to transaction conflicts", async () => {
    const domainError = new Error("Business rule rejected the operation");
    const transaction = jest.fn().mockRejectedValue(domainError);
    const manager = new PrismaTransactionManager(
      { $transaction: transaction } as unknown as PrismaClient,
      { maxRetries: 2, retryDelayMs: 0 },
    );

    await expect(manager.execute(async () => undefined)).rejects.toBe(
      domainError,
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
