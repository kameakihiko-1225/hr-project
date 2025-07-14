-- CreateIndex
CREATE INDEX "bots_company_id_idx" ON "bots"("company_id");

-- CreateIndex
CREATE INDEX "candidates_position_id_idx" ON "candidates"("position_id");

-- CreateIndex
CREATE INDEX "candidates_bot_id_idx" ON "candidates"("bot_id");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "department_positions_department_id_idx" ON "department_positions"("department_id");

-- CreateIndex
CREATE INDEX "department_positions_position_id_idx" ON "department_positions"("position_id");

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE INDEX "file_storage_company_id_idx" ON "file_storage"("company_id");

-- CreateIndex
CREATE INDEX "positions_title_idx" ON "positions"("title");
