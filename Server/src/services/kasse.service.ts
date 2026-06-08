import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentRepository } from '../repositories/payment.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import type { ITenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { tenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { requireStaff } from '../utils/require-staff.js';
import type { IVerifoneClient } from './verifone/verifone.client.js';
import { verifoneClient } from './verifone/verifone.client.js';
import { orderActionsService } from './order-actions.service.js';

const saleSchema = z.object({
  amountOre: z
    .number()
    .int('Amount must be whole øre (no decimals)')
    .min(100, 'Minimum payment is 1.00 DKK (100 øre)'),
  currency: z.string().length(3).optional().default('DKK'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export class KasseService {
  constructor(
    private readonly orders: IOrderRepository = orderRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly verifoneConfigs: ITenantVerifoneConfigRepository = tenantVerifoneConfigRepository,
    private readonly verifone: IVerifoneClient = verifoneClient,
  ) {}

  async createSale(
    auth: JwtPayload,
    tenant: { id: string; slug: string; verifoneConnectedAt: Date | null },
    input: unknown,
  ) {
    requireStaff(auth, tenant.id, tenant.slug, 'orders:write', 'You must be logged in as shop staff to use the kasse.');

    const data = saleSchema.parse(input);
    const vfConfig = await this.verifoneConfigs.findByTenantId(tenant.id);
    if (!vfConfig || !tenant.verifoneConnectedAt) {
      throw new AppError(
        'In-store payments are not set up yet. Add your Verifone terminal details in shop setup.',
        503,
      );
    }

    const order = await this.orders.create({
      tenantId: tenant.id,
      channel: 'terminal',
      amountOre: data.amountOre,
      currency: data.currency,
      description: data.description,
    });

    const payment = await this.payments.create({
      tenantId: tenant.id,
      orderId: order.id,
      channel: 'terminal',
      verifoneTransactionId: order.quickpayOrderRef,
      poiId: vfConfig.poiId,
      amountOre: data.amountOre,
      currency: data.currency,
      status: 'pending',
    });

    const sale = await this.verifone.createSale(tenant.id, {
      transactionId: order.quickpayOrderRef,
      amountOre: data.amountOre,
      currency: data.currency,
    });

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

  async getSale(auth: JwtPayload, tenant: { id: string; slug: string }, orderId: string) {
    requireStaff(auth, tenant.id, tenant.slug, 'orders:write', 'You must be logged in as shop staff to use the kasse.');

    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order || order.channel !== 'terminal') {
      throw new AppError('Sale not found.', 404);
    }

    const meta = orderActionsService.buildActionMeta(order, order.payment);

    return {
      orderId: order.id,
      amountOre: order.amountOre,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      channel: order.channel,
      createdAt: order.createdAt.toISOString(),
      allowedActions: meta.allowedActions,
    };
  }
}

export const kasseService = new KasseService();
