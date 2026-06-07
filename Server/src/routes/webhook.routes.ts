import express, { type Express } from 'express';
import { quickpayWebhookController } from '../controllers/webhook.controller.js';

export function registerWebhookRoutes(app: Express) {
  app.post(
    '/api/v1/webhooks/quickpay/:tenantId',
    express.raw({ type: 'application/json' }),
    quickpayWebhookController,
  );
}
