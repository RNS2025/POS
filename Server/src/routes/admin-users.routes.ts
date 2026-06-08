import type { Express } from 'express';
import {
  createAdminUserController,
  listAdminUsersController,
  resetAdminUserPasswordController,
  updateAdminUserController,
} from '../controllers/admin-users.controller.js';
import { requireAuth, requirePasswordChanged, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const tenant = [
  requireAuth,
  resolveTenantFromSlug('tenantSlug'),
  requireTenantMatch('tenantSlug'),
  requirePasswordChanged(),
];

export function registerAdminUsersRoutes(app: Express) {
  app.get('/api/v1/tenants/:tenantSlug/admin/users', ...tenant, listAdminUsersController);
  app.post('/api/v1/tenants/:tenantSlug/admin/users', ...tenant, createAdminUserController);
  app.patch('/api/v1/tenants/:tenantSlug/admin/users/:userId', ...tenant, updateAdminUserController);
  app.post(
    '/api/v1/tenants/:tenantSlug/admin/users/:userId/reset-password',
    ...tenant,
    resetAdminUserPasswordController,
  );
}
