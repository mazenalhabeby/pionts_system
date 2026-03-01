-- CreateTable: org_memberships
CREATE TABLE "org_memberships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: copy user org_id + role into org_memberships
INSERT INTO "org_memberships" ("user_id", "org_id", "role", "created_at")
SELECT "id", "org_id", "role", "created_at" FROM "users";

-- Drop the FK constraint from users.org_id
ALTER TABLE "users" DROP CONSTRAINT "users_org_id_fkey";

-- Drop org_id and role columns from users
ALTER TABLE "users" DROP COLUMN "org_id";
ALTER TABLE "users" DROP COLUMN "role";

-- CreateIndex
CREATE INDEX "org_memberships_org_id_idx" ON "org_memberships"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_memberships_user_id_org_id_key" ON "org_memberships"("user_id", "org_id");

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
