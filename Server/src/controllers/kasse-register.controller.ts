import type { Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import type { KasseSessionRequest } from '../middleware/kasse-session.middleware.js';
import { kassePinService } from '../services/kasse-pin.service.js';
import { kasseRegisterService } from '../services/kasse-register.service.js';

type RegisterRequest = KasseSessionRequest;

export const kassePinController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kassePinService.login(
    { id: req.tenant!.id, slug: req.tenant!.slug },
    req.kasse!,
    req.body,
  );
  res.json(result);
});

export const getKasseCatalogController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kasseRegisterService.getCatalog(
    { id: req.tenant!.id, slug: req.tenant!.slug, name: req.tenant!.name },
    req.kasse!,
  );
  res.json(result);
});

export const createKasseSaleController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kasseRegisterService.createTerminalSale(
    {
      id: req.tenant!.id,
      slug: req.tenant!.slug,
      verifoneConnectedAt: req.tenant!.verifoneConnectedAt,
    },
    req.kasse!,
    req.kasseSession!,
    req.body,
  );
  res.status(201).json(result);
});

export const createKasseQrController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kasseRegisterService.createQrPayment(
    {
      id: req.tenant!.id,
      slug: req.tenant!.slug,
      quickpayConnectedAt: req.tenant!.quickpayConnectedAt,
    },
    req.kasse!,
    req.kasseSession!,
    req.body,
  );
  res.status(201).json(result);
});

export const getKasseOrderStatusController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kasseRegisterService.getOrderStatus(req.tenant!.id, req.params.orderId!);
  res.json(result);
});

export const getKasseReceiptController = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await kasseRegisterService.getReceipt(
    req.tenant!.id,
    req.kasse!,
    req.params.orderId!,
    req.kasseSession!.displayName ?? null,
  );
  res.json(result);
});
