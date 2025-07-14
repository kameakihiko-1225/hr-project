-- Add start time tracking fields to candidates
ALTER TABLE "candidates" ADD COLUMN "start_time_phase1" TIMESTAMP(6);
ALTER TABLE "candidates" ADD COLUMN "start_time_phase2" TIMESTAMP(6);
ALTER TABLE "candidates" ADD COLUMN "bitrix_stage_start_time" JSONB; 