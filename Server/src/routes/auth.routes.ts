import type { Express } from 'express';
import { getSetupController, putQuickpaySetupController, putVerifoneSetupController } from '../controllers/setup.controller.js';
import {
  requireAuth,
  requireTenantMatch,
} from '../middleware/auth.middleware.js';
import { registerController, loginController, getInviteController, acceptInviteController } from '../controllers/auth.controller.js';

export function registerAuthRoutes(app: Express) {
  app.post('/api/v1/auth/register', registerController);
  app.post('/api/v1/auth/login', loginController);
  app.get('/api/v1/invites/:token', getInviteController);
  app.post('/api/v1/invites/:token/accept', acceptInviteController);
}

export function registerSetupRoutes(app: Express) {
  app.get(
    '/api/v1/tenants/:tenantSlug/setup',
    requireAuth,
    requireTenantMatch('tenantSlug'),
    getSetupController,
  );
  app.put(
    '/api/v1/tenants/:tenantSlug/setup/quickpay',
    requireAuth,
    requireTenantMatch('tenantSlug'),
    putQuickpaySetupController,
  );
  app.put(
    '/api/v1/tenants/:tenantSlug/setup/verifone',
    requireAuth,
    requireTenantMatch('tenantSlug'),
    putVerifoneSetupController,
  );
}
