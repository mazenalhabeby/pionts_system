-- CreateIndex
CREATE INDEX "customers_project_id_last_activity_idx" ON "customers"("project_id", "last_activity");

-- CreateIndex
CREATE INDEX "customers_project_id_created_at_idx" ON "customers"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "points_log_project_id_created_at_idx" ON "points_log"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "points_log_project_id_type_created_at_idx" ON "points_log"("project_id", "type", "created_at");
