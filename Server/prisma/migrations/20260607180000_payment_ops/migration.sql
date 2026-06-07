-- AlterTable
ALTER TABLE "payments" ADD COLUMN "refunded_amount_ore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "payments" ADD COLUMN "verifone_poi_transaction_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "verifone_poi_timestamp" TIMESTAMP(3);

-- DropIndex (verifone_transaction_id unique blocks retries)
DROP INDEX IF EXISTS "payments_verifone_transaction_id_key";

-- CreateIndex
CREATE INDEX "orders_tenant_id_status_idx" ON "orders"("tenant_id", "status");

-- CreateTable
CREATE TABLE "payment_actions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "amount_ore" INTEGER,
    "status" TEXT NOT NULL,
    "gateway_ref" TEXT,
    "error" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_actions_idempotency_key_key" ON "payment_actions"("idempotency_key");
CREATE INDEX "payment_actions_tenant_id_order_id_idx" ON "payment_actions"("tenant_id", "order_id");

-- AddForeignKey
ALTER TABLE "payment_actions" ADD CONSTRAINT "payment_actions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_actions" ADD CONSTRAINT "payment_actions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
