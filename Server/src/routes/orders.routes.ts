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
import { requireAuth, requirePasswordChanged, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const tenant = [
  requireAuth,
  resolveTenantFromSlug('tenantSlug'),
  requireTenantMatch('tenantSlug'),
  requirePasswordChanged(),
];

export function registerOrdersRoutes(app: Express) {
  app.get('/api/v1/tenants/:tenantSlug/orders', ...tenant, listOrdersController);
  app.get('/api/v1/tenants/:tenantSlug/orders/:orderId/detail', ...tenant, getOrderDetailController);
  app.post('/api/v1/tenants/:tenantSlug/orders/:orderId/sync-status', ...tenant, syncOrderStatusController);
  app.post('/api/v1/tenants/:tenantSlug/orders/:orderId/retry', ...tenant, retryOrderController);
  app.post('/api/v1/tenants/:tenantSlug/orders/:orderId/refund', ...tenant, refundOrderController);
  app.post('/api/v1/tenants/:tenantSlug/orders/:orderId/void', ...tenant, voidOrderController);
  app.post('/api/v1/tenants/:tenantSlug/kasse/sales/:orderId/abort', ...tenant, abortKasseSaleController);
  app.post(
    '/api/v1/tenants/:tenantSlug/orders/:orderId/mark-cancelled',
    resolveTenantFromSlug('tenantSlug'),
    markOrderCancelledController,
  );
}
