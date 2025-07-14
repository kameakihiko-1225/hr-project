-- CreateTable
CREATE TABLE "message_campaigns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "message" TEXT NOT NULL,
  "media_type" TEXT,
  "media_file_id" TEXT,
  "media_url" TEXT,
  "filter_criteria" JSONB,
  "admin_id" UUID NOT NULL,
  "company_id" UUID,
  "department_id" UUID,
  "position_id" UUID,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "message_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "campaign_id" UUID NOT NULL,
  "scheduled_time" TIMESTAMP(6) NOT NULL,
  "recurrence" TEXT,
  "last_run" TIMESTAMP(6),
  "next_run" TIMESTAMP(6),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sent_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "message_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "message_campaigns_admin_id_idx" ON "message_campaigns"("admin_id");
CREATE INDEX "message_campaigns_company_id_idx" ON "message_campaigns"("company_id");
CREATE INDEX "message_campaigns_department_id_idx" ON "message_campaigns"("department_id");
CREATE INDEX "message_campaigns_position_id_idx" ON "message_campaigns"("position_id");
CREATE INDEX "scheduled_messages_campaign_id_idx" ON "scheduled_messages"("campaign_id");
CREATE INDEX "scheduled_messages_status_idx" ON "scheduled_messages"("status");
CREATE INDEX "scheduled_messages_next_run_idx" ON "scheduled_messages"("next_run"); 