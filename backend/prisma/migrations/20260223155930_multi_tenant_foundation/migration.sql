-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Default',
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "shopify_customer_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "referral_code" TEXT NOT NULL,
    "referred_by" TEXT,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "points_earned_total" INTEGER NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "signup_rewarded" BOOLEAN NOT NULL DEFAULT false,
    "first_order_rewarded" BOOLEAN NOT NULL DEFAULT false,
    "followed_tiktok" BOOLEAN NOT NULL DEFAULT false,
    "followed_instagram" BOOLEAN NOT NULL DEFAULT false,
    "birthday" TEXT,
    "birthday_rewarded_year" INTEGER NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" TEXT,
    "verification_expiry" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_log" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_tree" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "grandparent_id" INTEGER,

    CONSTRAINT "referral_tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "discount_code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_orders" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_shopify_customer_id_key" ON "customers"("shopify_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_project_id_email_key" ON "customers"("project_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_project_id_referral_code_key" ON "customers"("project_id", "referral_code");

-- CreateIndex
CREATE INDEX "points_log_customer_id_created_at_idx" ON "points_log"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "points_log_order_id_idx" ON "points_log"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_tree_customer_id_key" ON "referral_tree"("customer_id");

-- CreateIndex
CREATE INDEX "referral_tree_parent_id_idx" ON "referral_tree"("parent_id");

-- CreateIndex
CREATE INDEX "referral_tree_grandparent_id_idx" ON "referral_tree"("grandparent_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_tree_project_id_customer_id_key" ON "referral_tree"("project_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "redemptions_discount_code_key" ON "redemptions"("discount_code");

-- CreateIndex
CREATE INDEX "redemptions_customer_id_idx" ON "redemptions"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "processed_orders_project_id_order_id_key" ON "processed_orders"("project_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_project_id_key_key" ON "settings"("project_id", "key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_log" ADD CONSTRAINT "points_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_log" ADD CONSTRAINT "points_log_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_tree" ADD CONSTRAINT "referral_tree_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_tree" ADD CONSTRAINT "referral_tree_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_tree" ADD CONSTRAINT "referral_tree_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_tree" ADD CONSTRAINT "referral_tree_grandparent_id_fkey" FOREIGN KEY ("grandparent_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_orders" ADD CONSTRAINT "processed_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
