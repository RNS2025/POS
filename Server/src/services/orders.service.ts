import type { JwtPayload } from '../infra/jwt.js';
import { AppError } from '../infra/app-error.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentActionRepository } from '../repositories/payment-action.repository.js';
import { paymentActionRepository } from '../repositories/payment-action.repository.js';
import type { OrderStatus } from '../types/order-status.js';
import type { PaymentChannel } from '../types/payment-channel.js';
import { requireStaff } from '../utils/require-staff.js';
import { orderActionsService } from './order-actions.service.js';
import { quickpaySyncService } from './quickpay/quickpay-sync.service.js';

export class OrdersService {
  constructor(
    private readonly orders: IOrderRepository = orderRepository,
    private readonly paymentActions: IPaymentActionRepository = paymentActionRepository,
  ) {}

  async list(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    query: { page?: number; limit?: number; status?: string; channel?: string; q?: string },
  ) {
    requireStaff(auth, tenant.id, tenant.slug);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.orders.listForTenant(tenant.id, page, limit, {
      status: query.status,
      channel: query.channel,
      q: query.q,
    });

    return {
      items: items.map((o) => ({
        id: o.id,
        quickpayOrderRef: o.quickpayOrderRef,
        channel: o.channel as PaymentChannel,
        amountOre: o.amountOre,
        currency: o.currency,
        status: o.status as OrderStatus,
        paymentStatus: o.payment?.status ?? null,
        customerEmail: o.customerEmail,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getDetail(auth: JwtPayload, tenant: { id: string; slug: string }, orderId: string) {
    requireStaff(auth, tenant.id, tenant.slug);

    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    const actions = await this.paymentActions.listForOrder(tenant.id, orderId);
    const meta = orderActionsService.buildActionMeta(order, order.payment);

    return {
      id: order.id,
      quickpayOrderRef: order.quickpayOrderRef,
      channel: order.channel as PaymentChannel,
      amountOre: order.amountOre,
      currency: order.currency,
      status: order.status as OrderStatus,
      paymentStatus: order.payment?.status ?? null,
      paymentUrl: order.payment?.paymentLinkUrl ?? null,
      refundedAmountOre: order.payment?.refundedAmountOre ?? 0,
      refundableAmountOre: meta.refundableAmountOre,
      customerEmail: order.customerEmail,
      description: order.description,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      allowedActions: meta.allowedActions,
      actionHints: meta.actionHints,
      paymentActions: actions.map((a) => ({
        id: a.id,
        action: a.action,
        amountOre: a.amountOre,
        status: a.status,
        error: a.error,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async syncStatus(auth: JwtPayload, tenant: { id: string; slug: string }, orderId: string) {
    requireStaff(auth, tenant.id, tenant.slug);
    const result = await quickpaySyncService.syncOrderFromQuickpay(tenant.id, orderId, {
      force: true,
    });
    return {
      orderId,
      synced: result.synced,
      status: result.orderStatus,
      paymentStatus: result.paymentStatus,
    };
  }
}

export const ordersService = new OrdersService();
