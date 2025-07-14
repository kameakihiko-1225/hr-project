/*
  Warnings:

  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[start_token]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.
  - Made the column `processing_status` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `chunk_count` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `training_status` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_position_id_fkey";

-- AlterTable
ALTER TABLE "bots" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "start_token" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "training_params" JSONB,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "file_name" SET DATA TYPE TEXT,
ALTER COLUMN "processing_status" SET NOT NULL,
ALTER COLUMN "processing_status" SET DATA TYPE TEXT,
ALTER COLUMN "content_type" SET DATA TYPE TEXT,
ALTER COLUMN "chunk_count" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "company_id" UUID,
ADD COLUMN     "interview_questions" JSONB;

-- AlterTable
ALTER TABLE "training_sessions" ALTER COLUMN "session_name" SET DATA TYPE TEXT,
ALTER COLUMN "training_status" SET NOT NULL,
ALTER COLUMN "training_status" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "jobs";

-- Enable pgvector extension for embedding support
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID,
    "content" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_bots" (
    "company_id" UUID NOT NULL,
    "bot_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_bots_pkey" PRIMARY KEY ("company_id","bot_id")
);

-- CreateIndex
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- CreateIndex
CREATE INDEX "document_chunks_embedding_idx" ON "document_chunks"("embedding");

-- CreateIndex
CREATE INDEX "company_bots_bot_id_idx" ON "company_bots"("bot_id");

-- CreateIndex
CREATE INDEX "company_bots_company_id_idx" ON "company_bots"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_start_token_key" ON "candidates"("start_token");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_company_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_bots" ADD CONSTRAINT "company_bots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_bots" ADD CONSTRAINT "company_bots_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
