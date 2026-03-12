-- DropIndex (replace global unique with project-scoped)
DROP INDEX IF EXISTS "customers_shopify_customer_id_key";

-- DropIndex (replace customerId-only with compound)
DROP INDEX IF EXISTS "redemptions_customer_id_idx";

-- CreateIndex: ApiKey.keyHash for fast API key resolution
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex: Customer(projectId, shopifyCustomerId) compound unique
CREATE UNIQUE INDEX "customers_project_id_shopify_customer_id_key" ON "customers"("project_id", "shopify_customer_id");

-- CreateIndex: Project.orgId for dashboard org queries
CREATE INDEX "projects_org_id_idx" ON "projects"("org_id");

-- CreateIndex: Redemption(projectId, customerId) compound index
CREATE INDEX "redemptions_project_id_customer_id_idx" ON "redemptions"("project_id", "customer_id");

-- CreateIndex: ReferralTree(projectId, parentId) compound index
CREATE INDEX "referral_tree_project_id_parent_id_idx" ON "referral_tree"("project_id", "parent_id");
