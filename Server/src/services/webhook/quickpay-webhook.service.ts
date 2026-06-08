import { AppError } from '../../infra/app-error.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import { decryptSecret } from '../../infra/crypto.js';
import type { IPaymentRepository } from '../../repositories/payment.repository.js';
import { paymentRepository } from '../../repositories/payment.repository.js';
import type { IPaymentWebhookEventRepository } from '../../repositories/payment-webhook-event.repository.js';
import { paymentWebhookEventRepository } from '../../repositories/payment-webhook-event.repository.js';
import type { IOrderRepository } from '../../repositories/order.repository.js';
import { orderRepository } from '../../repositories/order.repository.js';
import type { ITenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import { tenantRepository } from '../../repositories/tenant.repository.js';
import { verifyQuickpayChecksum } from '../quickpay/quickpay-checksum.js';
import {
  mapQuickpayToStatuses,
  merchantIdsMatch,
  type QuickpayCallbackPayment,
} from './quickpay-webhook-logic.js';

export class QuickpayWebhookService {
  constructor(
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly orders: IOrderRepository = orderRepository,
    private readonly webhookEvents: IPaymentWebhookEventRepository = paymentWebhookEventRepository,
  ) {}

  async handleCallback(tenantId: string, rawBody: string, checksumHeader: string | undefined) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant || tenant.lifecycleStatus === 'archived') {
      throw new AppError('Quickpay is not configured for this shop.', 404);
    }

    const config = await this.quickpayConfigs.findByTenantId(tenantId);
    if (!config) {
      throw new AppError('Quickpay is not configured for this shop.', 404);
    }

    const privateKey = decryptSecret(config.privateKeyEnc);
    if (!verifyQuickpayChecksum(rawBody, privateKey, checksumHeader)) {
      throw new AppError('Quickpay callback checksum did not match.', 401);
    }

    let payload: QuickpayCallbackPayment;
    try {
      payload = JSON.parse(rawBody) as QuickpayCallbackPayment;
    } catch {
      throw new AppError('Quickpay callback body was not valid JSON.', 400);
    }

    if (!merchantIdsMatch(config.merchantId, payload.merchant_id)) {
      console.warn('[webhook] merchant_id mismatch', {
        tenantId,
        expected: config.merchantId,
        received: payload.merchant_id,
        quickpayPaymentId: payload.id,
      });
      throw new AppError('Quickpay merchant_id does not match this shop.', 400);
    }

    const payment = await this.payments.findByQuickpayIdForTenant(tenantId, payload.id);
    if (!payment) {
      throw new AppError('Payment not found for this shop.', 404);
    }

    if (payment.tenantId !== tenantId || payment.quickpayMerchantId !== config.merchantId) {
      throw new AppError('Payment tenant binding failed.', 400);
    }

    const operations = payload.operations ?? [];
    for (const op of operations) {
      const alreadyProcessed = await this.webhookEvents.exists(payment.id, op.id);
      if (alreadyProcessed) {
        continue;
      }

      await this.webhookEvents.create(payment.id, op.id, op.type);
    }

    const { orderStatus, paymentStatus, refundedAmountOre } = mapQuickpayToStatuses(
      payload,
      payment.refundedAmountOre,
      payment.amountOre,
    );

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.updateMany({
        where: { id: payment.id, tenantId },
        data: {
          status: paymentStatus,
          ...(refundedAmountOre !== undefined ? { refundedAmountOre } : {}),
        },
      });
      await tx.order.updateMany({
        where: { id: payment.orderId, tenantId },
        data: { status: orderStatus },
      });
    });

    return { ok: true };
  }
}

export const quickpayWebhookService = new QuickpayWebhookService();
