-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "clearhaus_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "quickpay_connected_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tenant_quickpay_config" (
    "tenant_id" UUID NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "private_key_enc" TEXT NOT NULL,
    "api_key_enc" TEXT NOT NULL,
    "last_ping_at" TIMESTAMP(3),
    "last_ping_ok" BOOLEAN,
    "last_ping_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_quickpay_config_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "platform_merchant_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_merchant_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_merchant_notes_tenant_id_idx" ON "platform_merchant_notes"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_quickpay_config" ADD CONSTRAINT "tenant_quickpay_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_merchant_notes" ADD CONSTRAINT "platform_merchant_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_merchant_notes" ADD CONSTRAINT "platform_merchant_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
