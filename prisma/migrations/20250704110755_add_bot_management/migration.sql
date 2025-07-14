/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `bots` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `bots` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[admin_id]` on the table `bots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Made the column `company_id` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `admin_id` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `chat_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bots" DROP CONSTRAINT "bots_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "bots" DROP CONSTRAINT "bots_company_id_fkey";

-- AlterTable
ALTER TABLE "bots" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "available_languages" JSONB NOT NULL DEFAULT '["en", "ru", "uz"]',
ADD COLUMN     "default_language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "questions_phase1" JSONB,
ADD COLUMN     "questions_phase2" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "webhook_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "webhook_url" TEXT,
ALTER COLUMN "company_id" SET NOT NULL,
ALTER COLUMN "admin_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "can_work_in_city" BOOLEAN,
ADD COLUMN     "currently_employed" BOOLEAN,
ADD COLUMN     "cv_url" TEXT,
ADD COLUMN     "english_level" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "last_activity" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "other_languages" TEXT,
ADD COLUMN     "phase1_responses" JSONB,
ADD COLUMN     "phase2_responses" JSONB,
ADD COLUMN     "preferred_language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "referral_source" TEXT,
ADD COLUMN     "salary_expectation" TEXT,
ADD COLUMN     "start_date" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "telegram_username" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "work_permit" BOOLEAN,
ADD COLUMN     "work_type" TEXT;

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "current_phase" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "current_step" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "last_message_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bots_token_key" ON "bots"("token");

-- CreateIndex
CREATE UNIQUE INDEX "bots_username_key" ON "bots"("username");

-- CreateIndex
CREATE UNIQUE INDEX "bots_admin_id_key" ON "bots"("admin_id");

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
