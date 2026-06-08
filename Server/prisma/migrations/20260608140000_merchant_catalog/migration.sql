-- AlterTable
ALTER TABLE "users" ADD COLUMN "display_name" TEXT,
ADD COLUMN "pin_hash" TEXT,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customer_phone" TEXT,
ADD COLUMN "payment_method" TEXT,
ADD COLUMN "kasse_id" UUID,
ADD COLUMN "staff_user_id" UUID;

-- CreateTable
CREATE TABLE "kasser" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "verifone_poi_id" TEXT,
    "pay_with_qr_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pay_with_sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pay_with_later_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kasser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_ore" INTEGER NOT NULL,
    "category_id" UUID,
    "image_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_kasse" (
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "kasse_id" UUID NOT NULL,

    CONSTRAINT "product_kasse_pkey" PRIMARY KEY ("product_id","kasse_id")
);

-- CreateTable
CREATE TABLE "order_line_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "unit_price_ore" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total_ore" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kasser_tenant_id_idx" ON "kasser"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "kasser_tenant_id_slug_key" ON "kasser"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "categories_tenant_id_sort_order_idx" ON "categories"("tenant_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_name_key" ON "categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_category_id_idx" ON "products"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "product_kasse_tenant_id_idx" ON "product_kasse"("tenant_id");

-- CreateIndex
CREATE INDEX "product_kasse_kasse_id_idx" ON "product_kasse"("kasse_id");

-- CreateIndex
CREATE INDEX "order_line_items_tenant_id_order_id_idx" ON "order_line_items"("tenant_id", "order_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_kasse_id_idx" ON "orders"("tenant_id", "kasse_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_staff_user_id_idx" ON "orders"("tenant_id", "staff_user_id");

-- AddForeignKey
ALTER TABLE "kasser" ADD CONSTRAINT "kasser_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kasse" ADD CONSTRAINT "product_kasse_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kasse" ADD CONSTRAINT "product_kasse_kasse_id_fkey" FOREIGN KEY ("kasse_id") REFERENCES "kasser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_kasse_id_fkey" FOREIGN KEY ("kasse_id") REFERENCES "kasser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default kiosk for existing tenants
INSERT INTO "kasser" ("id", "tenant_id", "type", "name", "slug", "updated_at")
SELECT gen_random_uuid(), t."id", 'kiosk', 'Customer kiosk', 'customer', CURRENT_TIMESTAMP
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1 FROM "kasser" k WHERE k."tenant_id" = t."id" AND k."slug" = 'customer'
);
