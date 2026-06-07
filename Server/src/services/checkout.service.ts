import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentRepository } from '../repositories/payment.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import type { ITenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import type { IQuickpayClient } from '../services/quickpay/quickpay.client.js';
import { quickpayClient } from '../services/quickpay/quickpay.client.js';
import { quickpaySyncService } from '../services/quickpay/quickpay-sync.service.js';

const checkoutSchema = z.object({
  amountOre: z
    .number()
    .int('Amount must be whole øre (no decimals)')
    .min(100, 'Minimum payment is 1.00 DKK (100 øre)'),
  currency: z.string().length(3).optional().default('DKK'),
  customerEmail: z.string().email('Enter a valid email address').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
});

export class CheckoutService {
  constructor(
    private readonly orders: IOrderRepository = orderRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
  ) {}

  async createCheckout(
    tenant: { id: string; slug: string; quickpayConnectedAt: Date | null },
    input: unknown,
  ) {
    const data = checkoutSchema.parse(input);

    const qpConfig = await this.quickpayConfigs.findByTenantId(tenant.id);
    if (!qpConfig || !tenant.quickpayConnectedAt) {
      throw new AppError(
        'This shop is not ready to accept payments yet. Quickpay must be connected first.',
        503,
      );
    }

    const order = await this.orders.create({
      tenantId: tenant.id,
      channel: 'online',
      amountOre: data.amountOre,
      currency: data.currency,
      customerEmail: data.customerEmail,
      description: data.description,
    });

    const continueUrl = `${config.appPublicUrl}/${tenant.slug}/checkout/success?orderId=${order.id}`;
    const cancelUrl = `${config.appPublicUrl}/${tenant.slug}/checkout/cancel?orderId=${order.id}`;

    let link: { quickpayPaymentId: number; paymentUrl: string; merchantId: string };
    try {
      link = await this.quickpay.createPaymentLink(tenant.id, {
        orderId: order.quickpayOrderRef,
        amountOre: data.amountOre,
        currency: data.currency,
        continueUrl,
        cancelUrl,
      });
    } catch (err) {
      await this.orders.updateStatus(tenant.id, order.id, 'failed');
      throw new AppError(
        err instanceof Error ? err.message : 'Could not start payment with Quickpay.',
        502,
      );
    }

    await this.payments.create({
      tenantId: tenant.id,
      orderId: order.id,
      channel: 'online',
      quickpayPaymentId: link.quickpayPaymentId,
      quickpayMerchantId: link.merchantId,
      amountOre: data.amountOre,
      currency: data.currency,
      paymentLinkUrl: link.paymentUrl,
    });

    return {
      orderId: order.id,
      amountOre: order.amountOre,
      currency: order.currency,
      status: order.status,
      paymentUrl: link.paymentUrl,
    };
  }

  async getOrderStatus(tenantId: string, orderId: string) {
    const order = await this.orders.findByIdForTenant(tenantId, orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    return {
      orderId: order.id,
      amountOre: order.amountOre,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  async syncPayment(tenantId: string, orderId: string) {
    const result = await quickpaySyncService.syncOrderFromQuickpay(tenantId, orderId);
    return {
      orderId,
      synced: result.synced,
      status: result.orderStatus,
      paymentStatus: result.paymentStatus,
    };
  }
}

export const checkoutService = new CheckoutService();
