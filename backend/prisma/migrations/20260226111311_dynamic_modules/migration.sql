/*
  Warnings:

  - You are about to drop the column `grandparent_id` on the `referral_tree` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "referral_tree" DROP CONSTRAINT "referral_tree_grandparent_id_fkey";

-- DropIndex
DROP INDEX "referral_tree_grandparent_id_idx";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "is_partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partner_commission_pct" DECIMAL(5,2),
ADD COLUMN     "partner_credit_balance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "partners_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "points_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "referrals_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "referral_tree" DROP COLUMN "grandparent_id";

-- CreateTable
CREATE TABLE "earn_actions" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "social_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earn_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_action_log" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "action_slug" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER,

    CONSTRAINT "customer_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_tiers" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "redemption_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_levels" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "referral_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_earnings" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_total" DECIMAL(10,2) NOT NULL,
    "commission_pct" DECIMAL(5,2) NOT NULL,
    "amount_earned" DECIMAL(10,2) NOT NULL,
    "reward_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "earn_actions_project_id_enabled_idx" ON "earn_actions"("project_id", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "earn_actions_project_id_slug_key" ON "earn_actions"("project_id", "slug");

-- CreateIndex
CREATE INDEX "customer_action_log_project_id_customer_id_idx" ON "customer_action_log"("project_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_action_log_project_id_customer_id_action_slug_year_key" ON "customer_action_log"("project_id", "customer_id", "action_slug", "year");

-- CreateIndex
CREATE INDEX "redemption_tiers_project_id_idx" ON "redemption_tiers"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_levels_project_id_level_key" ON "referral_levels"("project_id", "level");

-- CreateIndex
CREATE INDEX "partner_earnings_project_id_partner_id_idx" ON "partner_earnings"("project_id", "partner_id");

-- AddForeignKey
ALTER TABLE "earn_actions" ADD CONSTRAINT "earn_actions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_action_log" ADD CONSTRAINT "customer_action_log_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption_tiers" ADD CONSTRAINT "redemption_tiers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_levels" ADD CONSTRAINT "referral_levels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_earnings" ADD CONSTRAINT "partner_earnings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_earnings" ADD CONSTRAINT "partner_earnings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_earnings" ADD CONSTRAINT "partner_earnings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
