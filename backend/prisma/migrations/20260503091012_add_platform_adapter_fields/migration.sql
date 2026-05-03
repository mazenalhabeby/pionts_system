-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "external_customer_id" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "platform_api_key" TEXT,
ADD COLUMN     "platform_api_url" TEXT,
ADD COLUMN     "platform_webhook_secret" TEXT;

-- CreateIndex
CREATE INDEX "customers_project_id_external_customer_id_idx" ON "customers"("project_id", "external_customer_id");
