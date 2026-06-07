-- Backfill quickpay_order_ref for existing orders, then enforce NOT NULL + unique constraint.

ALTER TABLE "orders" ADD COLUMN "quickpay_order_ref" VARCHAR(20);

UPDATE "orders"
SET "quickpay_order_ref" = SUBSTRING(REPLACE(id::text, '-', ''), 1, 20)
WHERE "quickpay_order_ref" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "quickpay_order_ref" SET NOT NULL;

CREATE UNIQUE INDEX "orders_tenant_id_quickpay_order_ref_key" ON "orders"("tenant_id", "quickpay_order_ref");
