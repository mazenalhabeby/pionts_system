-- CreateTable
CREATE TABLE "email_queue" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_project_id_sent_created_at_idx" ON "email_queue"("project_id", "sent", "created_at");
