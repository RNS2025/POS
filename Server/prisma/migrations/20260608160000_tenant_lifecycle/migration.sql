-- Tenant lifecycle (archive) + platform audit log for GDPR offboarding v1

ALTER TABLE "tenants" ADD COLUMN "lifecycle_status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_audit_logs_tenant_id_idx" ON "platform_audit_logs"("tenant_id");

ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
