import type { Express } from 'express';
import {
  createKasseQrController,
  createKasseSaleController,
  getKasseCatalogController,
  getKasseOrderStatusController,
  getKasseReceiptController,
  kassePinController,
} from '../controllers/kasse-register.controller.js';
import { requireKasseSession } from '../middleware/kasse-session.middleware.js';
import { resolveRegisterKasse } from '../middleware/resolve-register-kasse.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const register = [resolveTenantFromSlug('tenantSlug'), resolveRegisterKasse('kasseSlug')];
const session = [...register, requireKasseSession];

export function registerKasseRegisterRoutes(app: Express) {
  app.post('/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/pin', ...register, kassePinController);
  app.get('/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/catalog', ...session, getKasseCatalogController);
  app.post('/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/sales', ...session, createKasseSaleController);
  app.post('/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/pay/qr', ...session, createKasseQrController);
  app.get(
    '/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/orders/:orderId',
    ...session,
    getKasseOrderStatusController,
  );
  app.get(
    '/api/v1/tenants/:tenantSlug/kasse/:kasseSlug/receipt/:orderId',
    ...session,
    getKasseReceiptController,
  );
}
