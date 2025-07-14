-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "ai_assessment" JSONB,
ADD COLUMN     "company_id" UUID,
ADD COLUMN     "completion_time_phase2" TIMESTAMP(6),
ADD COLUMN     "department_id" UUID;

-- CreateIndex
CREATE INDEX "candidates_department_id_idx" ON "candidates"("department_id");

-- CreateIndex
CREATE INDEX "candidates_company_id_idx" ON "candidates"("company_id");
