-- CreateEnum
CREATE TYPE "self_report_situation" AS ENUM ('SURPLUS', 'BREAK_EVEN', 'SLIGHT_SHORTFALL', 'SEVERE_SHORTFALL');

-- CreateTable
CREATE TABLE "self_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "reference_month" DATE NOT NULL,
    "situation" "self_report_situation" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "self_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "self_reports_user_id_reference_month_key" ON "self_reports"("user_id", "reference_month");

-- CreateIndex
CREATE INDEX "self_reports_company_id_reference_month_idx" ON "self_reports"("company_id", "reference_month");

-- AddForeignKey
ALTER TABLE "self_reports" ADD CONSTRAINT "self_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_reports" ADD CONSTRAINT "self_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
