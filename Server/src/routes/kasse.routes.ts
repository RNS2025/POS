import type { Express } from 'express';
import { createKasseSaleController, getKasseSaleController } from '../controllers/kasse.controller.js';
import { requireAuth, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

export function registerKasseRoutes(app: Express) {
  app.post(
    '/api/v1/tenants/:tenantSlug/kasse/sales',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    createKasseSaleController,
  );

  app.get(
    '/api/v1/tenants/:tenantSlug/kasse/sales/:orderId',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    getKasseSaleController,
  );
}
