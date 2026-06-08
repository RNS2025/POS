import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import type { Kasse } from '../generated/prisma/client.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentRepository } from '../repositories/payment.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import type { IProductRepository } from '../repositories/product.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import type { ITenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import type { IQuickpayClient } from './quickpay/quickpay.client.js';
import { quickpayClient } from './quickpay/quickpay.client.js';

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(['qr', 'later']),
  lines: z.array(lineSchema).min(1, 'Cart is empty'),
  customerPhone: z.string().min(8).max(20).optional(),
});

export class KioskCheckoutService {
  constructor(
    private readonly products: IProductRepository = productRepository,
    private readonly orders: IOrderRepository = orderRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
  ) {}

  async checkout(
    tenant: { id: string; slug: string; quickpayConnectedAt: Date | null },
    kasse: Kasse,
    input: unknown,
  ) {
    const data = checkoutSchema.parse(input);
    this.assertPaymentMethodAllowed(kasse, data.paymentMethod);

    if ((data.paymentMethod === 'later' || kasse.payWithSmsEnabled) && !data.customerPhone?.trim()) {
      throw new AppError('Enter a phone number to continue.', 400);
    }

    const catalogProducts = await this.products.listActiveForKasse(tenant.id, kasse.id);
    const byId = new Map(catalogProducts.map((p) => [p.id, p]));

    let amountOre = 0;
    const lineRows: Array<{
      productId: string;
      nameSnapshot: string;
      unitPriceOre: number;
      quantity: number;
      lineTotalOre: number;
    }> = [];

    for (const line of data.lines) {
      const product = byId.get(line.productId);
      if (!product) {
        throw new AppError('One or more products are not available on this kiosk.', 400);
      }
      const lineTotalOre = product.priceOre * line.quantity;
      amountOre += lineTotalOre;
      lineRows.push({
        productId: product.id,
        nameSnapshot: product.name,
        unitPriceOre: product.priceOre,
        quantity: line.quantity,
        lineTotalOre,
      });
    }

    if (amountOre < 100) {
      throw new AppError('Minimum order is 1.00 DKK.', 400);
    }

    if (data.paymentMethod === 'later') {
      const order = await this.orders.createWithLineItems(
        {
          tenantId: tenant.id,
          channel: 'online',
          amountOre,
          currency: 'DKK',
          customerPhone: data.customerPhone?.trim(),
          paymentMethod: 'later',
          kasseId: kasse.id,
          status: 'pending_payment',
        },
        lineRows,
      );

      return {
        orderId: order.id,
        amountOre: order.amountOre,
        currency: order.currency,
        status: 'pending_payment' as const,
      };
    }

    const qpConfig = await this.quickpayConfigs.findByTenantId(tenant.id);
    if (!qpConfig || !tenant.quickpayConnectedAt) {
      throw new AppError('This shop is not ready to accept payments yet.', 503);
    }

    const order = await this.orders.createWithLineItems(
      {
        tenantId: tenant.id,
        channel: 'online',
        amountOre,
        currency: 'DKK',
        customerPhone: data.customerPhone?.trim(),
        paymentMethod: 'qr',
        kasseId: kasse.id,
        status: 'pending',
      },
      lineRows,
    );

    const continueUrl = `${config.appPublicUrl}/${tenant.slug}/kiosk/${kasse.slug}/checkout/success?orderId=${order.id}`;
    const cancelUrl = `${config.appPublicUrl}/${tenant.slug}/kiosk/${kasse.slug}/checkout/cancel?orderId=${order.id}`;

    let link: { quickpayPaymentId: number; paymentUrl: string; merchantId: string };
    try {
      link = await this.quickpay.createPaymentLink(tenant.id, {
        orderId: order.quickpayOrderRef,
        amountOre,
        currency: 'DKK',
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
      amountOre,
      currency: 'DKK',
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

  private assertPaymentMethodAllowed(kasse: Kasse, method: 'qr' | 'later') {
    if (method === 'qr' && !kasse.payWithQrEnabled) {
      throw new AppError('Pay with QR is not enabled for this kiosk.', 400);
    }
    if (method === 'later' && !kasse.payWithLaterEnabled) {
      throw new AppError('Pay later is not enabled for this kiosk.', 400);
    }
  }
}

export const kioskCheckoutService = new KioskCheckoutService();
