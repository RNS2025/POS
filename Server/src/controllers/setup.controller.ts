import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { setupService } from '../services/setup.service.js';

export const getSetupController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await setupService.getSetup(req.auth!, req.params.tenantSlug!);
  res.json(result);
});

export const putQuickpaySetupController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await setupService.saveQuickpay(req.auth!, req.params.tenantSlug!, req.body);
    res.json(result);
  },
);

export const putVerifoneSetupController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await setupService.saveVerifone(req.auth!, req.params.tenantSlug!, req.body);
    res.json(result);
  },
);
