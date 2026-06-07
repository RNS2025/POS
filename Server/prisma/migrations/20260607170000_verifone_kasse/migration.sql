ALTER TABLE "tenants" ADD COLUMN "verifone_connected_at" TIMESTAMP(3);

ALTER TABLE "orders" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'online';

ALTER TABLE "payments" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'online';
ALTER TABLE "payments" ALTER COLUMN "quickpay_payment_id" DROP NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "quickpay_merchant_id" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "verifone_transaction_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "poi_id" TEXT;

CREATE UNIQUE INDEX "payments_verifone_transaction_id_key" ON "payments"("verifone_transaction_id");

CREATE TABLE "tenant_verifone_config" (
    "tenant_id" UUID NOT NULL,
    "user_uid" TEXT NOT NULL,
    "api_key_enc" TEXT NOT NULL,
    "poi_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "use_simulator" BOOLEAN NOT NULL DEFAULT true,
    "last_ping_at" TIMESTAMP(3),
    "last_ping_ok" BOOLEAN,
    "last_ping_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_verifone_config_pkey" PRIMARY KEY ("tenant_id")
);

ALTER TABLE "tenant_verifone_config" ADD CONSTRAINT "tenant_verifone_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
