import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { platformService } from '../services/platform.service.js';

export const listMerchantsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await platformService.listMerchants(req.auth!, req.query as Record<string, unknown>);
    res.json(result);
  },
);

export const getDashboardStatsController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await platformService.getDashboardStats(req.auth!);
  res.json(result);
});

export const createMerchantController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await platformService.createMerchant(req.auth!, req.body);
  res.status(201).json(result);
});

export const getMerchantController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await platformService.getMerchant(req.auth!, req.params.tenantId!);
  res.json(result);
});

export const pingMerchantQuickpayController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await platformService.pingQuickpay(req.auth!, req.params.tenantId!);
    res.json(result);
  },
);

export const patchMerchantController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await platformService.patchMerchant(req.auth!, req.params.tenantId!, req.body);
  res.json(result);
});

export const addMerchantNoteController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await platformService.addNote(req.auth!, req.params.tenantId!, req.body);
  res.status(201).json(result);
});

export const exportMerchantsController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const csv = await platformService.exportMerchantsCsv(req.auth!, req.query as Record<string, unknown>);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="merchants.csv"');
  res.send(csv);
});

export const listMerchantOrdersController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await platformService.listMerchantOrders(
      req.auth!,
      req.params.tenantId!,
      req.query as Record<string, unknown>,
    );
    res.json(result);
  },
);
