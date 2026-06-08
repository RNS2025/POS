-- AlterTable
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- Migrate merchant admin role to owner
UPDATE "users" SET "role" = 'owner' WHERE "role" = 'admin' AND "tenant_id" IS NOT NULL;
