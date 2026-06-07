import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { quickpayWebhookService } from '../services/webhook/quickpay-webhook.service.js';

export const quickpayWebhookController = asyncHandler(async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const checksum = req.headers['quickpay-checksum-sha256'] as string | undefined;

  await quickpayWebhookService.handleCallback(req.params.tenantId!, rawBody, checksum);
  res.status(200).send('OK');
});
