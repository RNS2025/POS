import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';
import { kasseService } from '../services/kasse.service.js';

export const createKasseSaleController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await kasseService.createSale(req.auth!, req.tenant!, req.body);
    res.status(201).json(result);
  },
);

export const getKasseSaleController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await kasseService.getSale(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);
