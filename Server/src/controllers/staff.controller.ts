import type { Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';
import { staffService } from '../services/staff.service.js';

type StaffRequest = AuthenticatedRequest & TenantRequest;

export const listStaffController = asyncHandler(async (req: StaffRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await staffService.list(req.auth!, { id: req.tenant!.id, slug: req.tenant!.slug }, page, limit);
  res.json(result);
});

export const createStaffController = asyncHandler(async (req: StaffRequest, res: Response) => {
  const result = await staffService.create(req.auth!, { id: req.tenant!.id, slug: req.tenant!.slug }, req.body);
  res.status(201).json(result);
});

export const updateStaffController = asyncHandler(async (req: StaffRequest, res: Response) => {
  const result = await staffService.update(
    req.auth!,
    { id: req.tenant!.id, slug: req.tenant!.slug },
    req.params.staffId!,
    req.body,
  );
  res.json(result);
});
