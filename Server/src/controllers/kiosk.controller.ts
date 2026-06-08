import type { Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { KioskKasseRequest } from '../middleware/resolve-kiosk-kasse.middleware.js';
import { kioskCatalogService } from '../services/kiosk-catalog.service.js';
import { kioskCheckoutService } from '../services/kiosk-checkout.service.js';
import { checkoutService } from '../services/checkout.service.js';

type KioskRequest = KioskKasseRequest;

export const getKioskCatalogController = asyncHandler(async (req: KioskRequest, res: Response) => {
  const result = await kioskCatalogService.getCatalog(
    { id: req.tenant!.id, slug: req.tenant!.slug, name: req.tenant!.name },
    req.kasse!,
  );
  res.json(result);
});

export const kioskCheckoutController = asyncHandler(async (req: KioskRequest, res: Response) => {
  const result = await kioskCheckoutService.checkout(req.tenant!, req.kasse!, req.body);
  res.status(201).json(result);
});

export const getKioskOrderStatusController = asyncHandler(async (req: KioskRequest, res: Response) => {
  const result = await checkoutService.getOrderStatus(req.tenant!.id, req.params.orderId!);
  res.json(result);
});
