-- A janela da jornada passa a ser da unidade, não do processo (#76). Até aqui
-- ela vinha de JOURNEY_WINDOW_*, uma só para todas as empresas — e a
-- cooperativa é Ouro Verde MT/PA: com America/Cuiaba fixo, a janela abria uma
-- hora mais tarde para quem está em Belém.
--
-- As faixas são linhas, e não um par de horários em colunas, porque o turno da
-- noite (#77) é 22:00–06:00: duas faixas em dias diferentes, a primeira
-- fechando em 1440 — a meia-noite seguinte. Minutos desde a meia-noite local
-- evitam guardar "24:00", que não é hora de relógio válida.

-- AlterTable
ALTER TABLE "companies" ADD COLUMN "journey_zone" TEXT NOT NULL DEFAULT 'America/Cuiaba';

-- CreateTable
CREATE TABLE "company_journey_shifts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opens_at" INTEGER NOT NULL,
    "closes_at" INTEGER NOT NULL,

    CONSTRAINT "company_journey_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_journey_shifts_company_id_idx" ON "company_journey_shifts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_journey_shifts_company_id_weekday_opens_at_key" ON "company_journey_shifts"("company_id", "weekday", "opens_at");

-- AddForeignKey
ALTER TABLE "company_journey_shifts" ADD CONSTRAINT "company_journey_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: segunda a sexta, 07:30 (450) às 18:00 (1080) para toda empresa que
-- já existe. Nenhuma muda de comportamento por causa desta migração — é o
-- critério de aceite da #76.
INSERT INTO "company_journey_shifts" ("id", "company_id", "weekday", "opens_at", "closes_at")
SELECT gen_random_uuid()::text, "companies"."id", "weekday", 450, 1080
FROM "companies"
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS "week"("weekday");
