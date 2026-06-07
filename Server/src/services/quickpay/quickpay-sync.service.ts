import { AppError } from '../../infra/app-error.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import type { IOrderRepository } from '../../repositories/order.repository.js';
import { orderRepository } from '../../repositories/order.repository.js';
import type { ITenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../../repositories/tenant-quickpay-config.repository.js';
import type { IQuickpayClient } from './quickpay.client.js';
import { quickpayClient } from './quickpay.client.js';
import {
  mapQuickpayToStatuses,
  merchantIdsMatch,
} from '../webhook/quickpay-webhook-logic.js';
import type { OrderStatus } from '../../types/order-status.js';

const AUTO_SYNC_STATUSES: OrderStatus[] = ['pending', 'authorized'];

const MANUAL_SYNC_STATUSES: OrderStatus[] = ['pending', 'authorized', 'failed', 'cancelled'];

const SYNC_COOLDOWN_MS = 30_000;

export class QuickpaySyncService {
  constructor(
    private readonly orders: IOrderRepository = orderRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
  ) {}

  /** Pull latest status from Quickpay when webhooks cannot reach localhost. */
  async syncOrderFromQuickpay(
    tenantId: string,
    orderId: string,
    options: { force?: boolean } = {},
  ): Promise<{ synced: boolean; orderStatus: OrderStatus; paymentStatus: string | null }> {
    const order = await this.orders.findByIdForTenant(tenantId, orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (order.channel !== 'online') {
      throw new AppError('Only online Quickpay orders can be synced.', 400);
    }

    const payment = order.payment;
    if (!payment?.quickpayPaymentId) {
      throw new AppError('No Quickpay payment linked to this order.', 400);
    }

    const allowed = options.force ? MANUAL_SYNC_STATUSES : AUTO_SYNC_STATUSES;
    if (!allowed.includes(order.status as OrderStatus)) {
      return {
        synced: false,
        orderStatus: order.status as OrderStatus,
        paymentStatus: payment.status,
      };
    }

    if (!options.force && this.isWithinCooldown(payment.lastQuickpaySyncAt)) {
      return {
        synced: false,
        orderStatus: order.status as OrderStatus,
        paymentStatus: payment.status,
      };
    }

    const config = await this.quickpayConfigs.findByTenantId(tenantId);
    if (!config) {
      throw new AppError('Quickpay is not configured for this shop.', 503);
    }

    const qpPayment = await this.quickpay.fetchPayment(tenantId, payment.quickpayPaymentId);
    if (!qpPayment) {
      throw new AppError('Could not load payment from Quickpay.', 502);
    }

    if (!merchantIdsMatch(config.merchantId, qpPayment.merchant_id)) {
      throw new AppError('Quickpay merchant_id does not match this shop.', 400);
    }

    const { orderStatus, paymentStatus, refundedAmountOre } = mapQuickpayToStatuses(
      qpPayment,
      payment.refundedAmountOre,
      payment.amountOre,
    );

    const changed = order.status !== orderStatus || payment.status !== paymentStatus;
    const now = new Date();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.updateMany({
        where: { id: payment.id, tenantId },
        data: {
          status: paymentStatus,
          lastQuickpaySyncAt: now,
          ...(refundedAmountOre !== undefined ? { refundedAmountOre } : {}),
        },
      });
      if (changed) {
        await tx.order.updateMany({
          where: { id: order.id, tenantId },
          data: { status: orderStatus },
        });
      }
    });

    return { synced: changed, orderStatus, paymentStatus };
  }

  private isWithinCooldown(lastQuickpaySyncAt: Date | null | undefined): boolean {
    if (!lastQuickpaySyncAt) {
      return false;
    }
    return Date.now() - lastQuickpaySyncAt.getTime() < SYNC_COOLDOWN_MS;
  }
}

export const quickpaySyncService = new QuickpaySyncService();
