import type { Express } from 'express';
import { createCheckoutController, getOrderStatusController, syncPaymentController } from '../controllers/checkout.controller.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

export function registerCheckoutRoutes(app: Express) {
  app.post(
    '/api/v1/tenants/:tenantSlug/checkout',
    resolveTenantFromSlug('tenantSlug'),
    createCheckoutController,
  );

  app.get(
    '/api/v1/tenants/:tenantSlug/orders/:orderId',
    resolveTenantFromSlug('tenantSlug'),
    getOrderStatusController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/sync-payment',
    resolveTenantFromSlug('tenantSlug'),
    syncPaymentController,
  );
}
