-- CreateEnum
CREATE TYPE "coops_stage" AS ENUM ('CONSCIENTIZAR', 'OBSERVAR', 'ORGANIZAR', 'PREPARAR', 'SUSTENTAR');

-- CreateTable
CREATE TABLE "content_pieces" (
    "id" TEXT NOT NULL,
    "stage" "coops_stage" NOT NULL,
    "order_in_stage" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "source_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "content_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_pieces_stage_order_in_stage_key" ON "content_pieces"("stage", "order_in_stage");

-- AlterTable
ALTER TABLE "daily_entries" ADD COLUMN "content_piece_id" TEXT,
ADD COLUMN "answer" TEXT,
ADD COLUMN "comprehended" BOOLEAN;

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_content_piece_id_fkey" FOREIGN KEY ("content_piece_id") REFERENCES "content_pieces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
