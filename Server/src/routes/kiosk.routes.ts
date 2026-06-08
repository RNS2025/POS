import type { Express } from 'express';
import {
  getKioskCatalogController,
  getKioskOrderStatusController,
  kioskCheckoutController,
} from '../controllers/kiosk.controller.js';
import { resolveKioskKasse } from '../middleware/resolve-kiosk-kasse.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const kiosk = [resolveTenantFromSlug('tenantSlug'), resolveKioskKasse('kasseSlug')];

export function registerKioskRoutes(app: Express) {
  app.get('/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/catalog', ...kiosk, getKioskCatalogController);
  app.post('/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/checkout', ...kiosk, kioskCheckoutController);
  app.get(
    '/api/v1/tenants/:tenantSlug/kiosk/:kasseSlug/orders/:orderId',
    ...kiosk,
    getKioskOrderStatusController,
  );
}
