import type { Express } from 'express';
import {
  abortKasseSaleController,
  getOrderDetailController,
  listOrdersController,
  markOrderCancelledController,
  refundOrderController,
  retryOrderController,
  syncOrderStatusController,
  voidOrderController,
} from '../controllers/orders.controller.js';
import { requireAuth, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

export function registerOrdersRoutes(app: Express) {
  app.get(
    '/api/v1/tenants/:tenantSlug/orders',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    listOrdersController,
  );

  app.get(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/detail',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    getOrderDetailController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/sync-status',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    syncOrderStatusController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/retry',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    retryOrderController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/refund',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    refundOrderController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/void',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    voidOrderController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/kasse/sales/:orderId/abort',
    requireAuth,
    resolveTenantFromSlug('tenantSlug'),
    requireTenantMatch('tenantSlug'),
    abortKasseSaleController,
  );

  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/mark-cancelled',
    resolveTenantFromSlug('tenantSlug'),
    markOrderCancelledController,
  );
}
