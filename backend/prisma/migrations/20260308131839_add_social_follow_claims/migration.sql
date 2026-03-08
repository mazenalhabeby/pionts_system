-- CreateTable
CREATE TABLE "social_follow_claims" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "action_slug" TEXT NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMP(3),

    CONSTRAINT "social_follow_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_follow_claims_project_id_customer_id_idx" ON "social_follow_claims"("project_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_follow_claims_project_id_customer_id_action_slug_key" ON "social_follow_claims"("project_id", "customer_id", "action_slug");

-- AddForeignKey
ALTER TABLE "social_follow_claims" ADD CONSTRAINT "social_follow_claims_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
