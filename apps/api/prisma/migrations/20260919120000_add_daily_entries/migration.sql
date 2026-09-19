-- CreateTable
CREATE TABLE "daily_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "mood" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_entries_user_id_entry_date_key" ON "daily_entries"("user_id", "entry_date");

-- CreateIndex
CREATE INDEX "daily_entries_company_id_entry_date_idx" ON "daily_entries"("company_id", "entry_date");

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
