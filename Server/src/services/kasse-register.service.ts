import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { Kasse } from '../generated/prisma/client.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentRepository } from '../repositories/payment.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import type { IProductRepository } from '../repositories/product.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import type { ITenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import type { ITenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { tenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { kioskCatalogService } from './kiosk-catalog.service.js';
import type { IQuickpayClient } from './quickpay/quickpay.client.js';
import { quickpayClient } from './quickpay/quickpay.client.js';
import type { IVerifoneClient } from './verifone/verifone.client.js';
import { verifoneClient } from './verifone/verifone.client.js';

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const linesSchema = z.object({
  lines: z.array(lineSchema).min(1, 'Cart is empty'),
});

export class KasseRegisterService {
  constructor(
    private readonly products: IProductRepository = productRepository,
    private readonly orders: IOrderRepository = orderRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly verifoneConfigs: ITenantVerifoneConfigRepository = tenantVerifoneConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
    private readonly verifone: IVerifoneClient = verifoneClient,
  ) {}

  async getCatalog(
    tenant: { id: string; slug: string; name: string },
    kasse: Kasse,
  ) {
    const base = await kioskCatalogService.getCatalog(tenant, kasse);
    return {
      shopName: base.shopName,
      kasseName: base.kasseName,
      kasseSlug: base.kasseSlug,
      verifonePoiId: kasse.verifonePoiId,
      payWithQrEnabled: kasse.payWithQrEnabled,
      categories: base.categories,
      products: base.products,
    };
  }

  async createTerminalSale(
    tenant: { id: string; slug: string; verifoneConnectedAt: Date | null },
    kasse: Kasse,
    session: JwtPayload,
    input: unknown,
  ) {
    if (!kasse.verifonePoiId?.trim()) {
      throw new AppError('No terminal is configured for this register. Use Pay with QR or set a POI ID in admin.', 400);
    }

    const vfConfig = await this.verifoneConfigs.findByTenantId(tenant.id);
    if (!vfConfig || !tenant.verifoneConnectedAt) {
      throw new AppError('In-store payments are not set up yet. Add Verifone in shop setup.', 503);
    }

    const { amountOre, lineRows } = await this.validateLines(tenant.id, kasse.id, input);
    const staffUserId = session.sub;

    const order = await this.orders.createWithLineItems(
      {
        tenantId: tenant.id,
        channel: 'terminal',
        amountOre,
        currency: 'DKK',
        paymentMethod: 'terminal',
        kasseId: kasse.id,
        staffUserId,
        status: 'pending',
      },
      lineRows,
    );

    const payment = await this.payments.create({
      tenantId: tenant.id,
      orderId: order.id,
      channel: 'terminal',
      verifoneTransactionId: order.quickpayOrderRef,
      poiId: kasse.verifonePoiId,
      amountOre,
      currency: 'DKK',
      status: 'pending',
    });

    const sale = await this.verifone.createSale(
      tenant.id,
      {
        transactionId: order.quickpayOrderRef,
        amountOre,
        currency: 'DKK',
      },
      { poiId: kasse.verifonePoiId },
    );

    const orderStatus = sale.ok ? 'captured' : 'failed';
    const paymentStatus = sale.ok ? 'captured' : 'failed';

    await this.orders.updateStatus(tenant.id, order.id, orderStatus);
    await this.payments.updateForRetry(tenant.id, payment.id, {
      verifoneTransactionId: sale.transactionId,
      verifonePoiTransactionId: sale.poiTransaction?.transactionId,
      verifonePoiTimestamp: sale.poiTransaction?.timestamp
        ? new Date(sale.poiTransaction.timestamp)
        : undefined,
      status: paymentStatus,
    });

    if (!sale.ok) {
      throw new AppError(sale.error ?? 'Payment was not approved on the terminal.', 402, {
        orderId: order.id,
      });
    }

    return {
      orderId: order.id,
      amountOre: order.amountOre,
      currency: order.currency,
      status: orderStatus,
      channel: 'terminal' as const,
    };
  }

  async createQrPayment(
    tenant: { id: string; slug: string; quickpayConnectedAt: Date | null },
    kasse: Kasse,
    session: JwtPayload,
    input: unknown,
  ) {
    if (!kasse.payWithQrEnabled) {
      throw new AppError('Pay with QR is not enabled for this register.', 400);
    }

    const qpConfig = await this.quickpayConfigs.findByTenantId(tenant.id);
    if (!qpConfig || !tenant.quickpayConnectedAt) {
      throw new AppError('This shop is not ready to accept QR payments yet.', 503);
    }

    const { amountOre, lineRows } = await this.validateLines(tenant.id, kasse.id, input);
    const staffUserId = session.sub;

    const order = await this.orders.createWithLineItems(
      {
        tenantId: tenant.id,
        channel: 'online',
        amountOre,
        currency: 'DKK',
        paymentMethod: 'qr',
        kasseId: kasse.id,
        staffUserId,
        status: 'pending',
      },
      lineRows,
    );

    const continueUrl = `${config.appPublicUrl}/${tenant.slug}/kasse/${kasse.slug}/receipt?orderId=${order.id}`;
    const cancelUrl = `${config.appPublicUrl}/${tenant.slug}/kasse/${kasse.slug}`;

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

  async getOrderStatus(tenantId: string, orderId: string) {
    const order = await this.orders.findByIdForTenant(tenantId, orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }
    return {
      orderId: order.id,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      amountOre: order.amountOre,
      currency: order.currency,
      paymentUrl: order.payment?.paymentLinkUrl ?? null,
    };
  }

  async getReceipt(tenantId: string, kasse: Kasse, orderId: string, staffDisplayName: string | null) {
    const order = await this.orders.findByIdWithLines(tenantId, orderId);
    if (!order || order.kasseId !== kasse.id) {
      throw new AppError('Sale not found.', 404);
    }
    return {
      orderId: order.id,
      amountOre: order.amountOre,
      currency: order.currency,
      status: order.status,
      kasseName: kasse.name,
      staffDisplayName,
      lines: order.lineItems,
      createdAt: order.createdAt.toISOString(),
    };
  }

  private async validateLines(tenantId: string, kasseId: string, input: unknown) {
    const data = linesSchema.parse(input);
    const catalogProducts = await this.products.listActiveForKasse(tenantId, kasseId);
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
        throw new AppError('One or more products are not available on this register.', 400);
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

    return { amountOre, lineRows };
  }
}

export const kasseRegisterService = new KasseRegisterService();
