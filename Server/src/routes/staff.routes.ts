import type { Express } from 'express';
import {
  createStaffController,
  listStaffController,
  updateStaffController,
} from '../controllers/staff.controller.js';
import { requireAuth, requirePasswordChanged, requireTenantMatch } from '../middleware/auth.middleware.js';
import { resolveTenantFromSlug } from '../middleware/resolve-tenant.middleware.js';

const tenant = [
  requireAuth,
  resolveTenantFromSlug('tenantSlug'),
  requireTenantMatch('tenantSlug'),
  requirePasswordChanged(),
];

export function registerStaffRoutes(app: Express) {
  app.get('/api/v1/tenants/:tenantSlug/staff', ...tenant, listStaffController);
  app.post('/api/v1/tenants/:tenantSlug/staff', ...tenant, createStaffController);
  app.patch('/api/v1/tenants/:tenantSlug/staff/:staffId', ...tenant, updateStaffController);
}
