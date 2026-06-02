-- Add base currency to projects (existing rows default to EUR)
ALTER TABLE "projects" ADD COLUMN "base_currency" TEXT NOT NULL DEFAULT 'EUR';

-- Add per-partner currency on customers (NULL for non-partners; resolved at read time to project base)
ALTER TABLE "customers" ADD COLUMN "partner_currency" TEXT;

-- Backfill: any existing partner gets the project's base currency as their partner currency
UPDATE "customers" c
SET "partner_currency" = p."base_currency"
FROM "projects" p
WHERE c."project_id" = p."id"
  AND c."is_partner" = TRUE
  AND c."partner_currency" IS NULL;

-- Add currency / status columns on partner_earnings (existing rows default to EUR / awarded)
ALTER TABLE "partner_earnings"
  ADD COLUMN "order_currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "partner_currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'awarded',
  ADD COLUMN "skipped_reason" TEXT;
