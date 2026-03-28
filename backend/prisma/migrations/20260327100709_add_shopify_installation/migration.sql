-- CreateTable
CREATE TABLE "shopify_installations" (
    "id" SERIAL NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "public_key" TEXT,
    "hmac_secret" TEXT,
    "webhook_ids" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMP(3),

    CONSTRAINT "shopify_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_installations_shop_domain_key" ON "shopify_installations"("shop_domain");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_installations_project_id_key" ON "shopify_installations"("project_id");

-- CreateIndex
CREATE INDEX "shopify_installations_org_id_idx" ON "shopify_installations"("org_id");

-- AddForeignKey
ALTER TABLE "shopify_installations" ADD CONSTRAINT "shopify_installations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_installations" ADD CONSTRAINT "shopify_installations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
