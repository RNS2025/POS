import type { Response } from 'express';
import { adminUsersService } from '../services/admin-users.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';

type AdminUsersRequest = AuthenticatedRequest & TenantRequest;

export const listAdminUsersController = asyncHandler(async (req: AdminUsersRequest, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const result = await adminUsersService.list(req.auth!, { id: req.tenant!.id, slug: req.tenant!.slug }, page, limit);
  res.json(result);
});

export const createAdminUserController = asyncHandler(async (req: AdminUsersRequest, res: Response) => {
  const result = await adminUsersService.create(req.auth!, { id: req.tenant!.id, slug: req.tenant!.slug }, req.body);
  res.status(201).json(result);
});

export const updateAdminUserController = asyncHandler(async (req: AdminUsersRequest, res: Response) => {
  const result = await adminUsersService.update(
    req.auth!,
    { id: req.tenant!.id, slug: req.tenant!.slug },
    req.params.userId!,
    req.body,
  );
  res.json(result);
});

export const resetAdminUserPasswordController = asyncHandler(async (req: AdminUsersRequest, res: Response) => {
  const result = await adminUsersService.resetPassword(
    req.auth!,
    { id: req.tenant!.id, slug: req.tenant!.slug },
    req.params.userId!,
    req.body,
  );
  res.json(result);
});
