import type { Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';
import { checkoutService } from '../services/checkout.service.js';

export const createCheckoutController = asyncHandler(async (req: TenantRequest, res: Response) => {
  const result = await checkoutService.createCheckout(req.tenant!, req.body);
  res.status(201).json(result);
});

export const getOrderStatusController = asyncHandler(async (req: TenantRequest, res: Response) => {
  const result = await checkoutService.getOrderStatus(req.tenant!.id, req.params.orderId!);
  res.json(result);
});

export const syncPaymentController = asyncHandler(async (req: TenantRequest, res: Response) => {
  const result = await checkoutService.syncPayment(req.tenant!.id, req.params.orderId!);
  res.json(result);
});
