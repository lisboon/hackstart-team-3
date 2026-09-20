-- Metas de guarda pessoais. Sem nenhum campo monetário: a meta mede intenção
-- e hábito, e o cumprimento deriva da declaração mensal (self_reports).

-- CreateEnum
CREATE TYPE "savings_goal_kind" AS ENUM ('MONTHLY', 'ENDURING');

-- CreateEnum
CREATE TYPE "savings_goal_status" AS ENUM ('ACTIVE', 'MET', 'ENDED');

-- CreateEnum
CREATE TYPE "savings_goal_unmet_reason" AS ENUM ('UNEXPECTED_EXPENSE', 'INCOME_DROP', 'CHANGED_PRIORITY', 'PREFER_NOT_SAY', 'OTHER');

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "kind" "savings_goal_kind" NOT NULL,
    "target_months" INTEGER,
    "start_month" DATE NOT NULL,
    "status" "savings_goal_status" NOT NULL DEFAULT 'ACTIVE',
    "unmet_reason" "savings_goal_unmet_reason",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "savings_goals_user_id_company_id_idx" ON "savings_goals"("user_id", "company_id");

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
