-- Add document training fields to existing documents table
ALTER TABLE "documents" ADD COLUMN "title" VARCHAR(255);
ALTER TABLE "documents" ADD COLUMN "content" TEXT;
ALTER TABLE "documents" ADD COLUMN "file_name" VARCHAR(255);
ALTER TABLE "documents" ADD COLUMN "file_size" INTEGER;
ALTER TABLE "documents" ADD COLUMN "processing_status" VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "documents" ADD COLUMN "content_type" VARCHAR(50);
ALTER TABLE "documents" ADD COLUMN "training_parameters" JSONB;
ALTER TABLE "documents" ADD COLUMN "embeddings" JSONB;
ALTER TABLE "documents" ADD COLUMN "chunk_count" INTEGER DEFAULT 0;
ALTER TABLE "documents" ADD COLUMN "processed_at" TIMESTAMP(6);
ALTER TABLE "documents" ADD COLUMN "updated_at" TIMESTAMP(6) DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX "documents_position_id_idx" ON "documents"("position_id");
CREATE INDEX "documents_processing_status_idx" ON "documents"("processing_status");
CREATE INDEX "documents_content_type_idx" ON "documents"("content_type");

-- Create training_sessions table for admin chat training
CREATE TABLE "training_sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "session_name" VARCHAR(255),
    "chat_history" JSONB,
    "training_status" VARCHAR(50) DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT NOW(),
    "updated_at" TIMESTAMP(6) DEFAULT NOW(),
    CONSTRAINT "training_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE,
    CONSTRAINT "training_sessions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE
);

-- Create indexes for training sessions
CREATE INDEX "training_sessions_admin_id_idx" ON "training_sessions"("admin_id");
CREATE INDEX "training_sessions_position_id_idx" ON "training_sessions"("position_id");
CREATE INDEX "training_sessions_status_idx" ON "training_sessions"("training_status"); 