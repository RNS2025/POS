import type { Express } from 'express';
import { getSetupController, putQuickpaySetupController, putVerifoneSetupController } from '../controllers/setup.controller.js';
import {
  requireAuth,
  requirePasswordChanged,
  requireTenantMatch,
} from '../middleware/auth.middleware.js';
import {
  registerController,
  loginController,
  getInviteController,
  acceptInviteController,
  changePasswordController,
} from '../controllers/auth.controller.js';

export function registerAuthRoutes(app: Express) {
  app.post('/api/v1/auth/register', registerController);
  app.post('/api/v1/auth/login', loginController);
  app.post('/api/v1/auth/change-password', requireAuth, changePasswordController);
  app.get('/api/v1/invites/:token', getInviteController);
  app.post('/api/v1/invites/:token/accept', acceptInviteController);
}

export function registerSetupRoutes(app: Express) {
  const tenant = [requireAuth, requireTenantMatch('tenantSlug'), requirePasswordChanged()];
  app.get('/api/v1/tenants/:tenantSlug/setup', ...tenant, getSetupController);
  app.put('/api/v1/tenants/:tenantSlug/setup/quickpay', ...tenant, putQuickpaySetupController);
  app.put('/api/v1/tenants/:tenantSlug/setup/verifone', ...tenant, putVerifoneSetupController);
}
