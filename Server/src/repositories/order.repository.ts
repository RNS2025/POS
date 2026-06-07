import type { Order, Payment, Prisma } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';
import { generateQuickpayOrderRef } from '../services/quickpay/quickpay-order-ref.js';

import type { PaymentChannel } from '../types/payment-channel.js';

export interface CreateOrderInput {
  tenantId: string;
  channel: PaymentChannel;
  amountOre: number;
  currency: string;
  customerEmail?: string;
  description?: string;
}

export interface OrderListFilters {
  status?: string;
  channel?: string;
  q?: string;
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  findByIdForTenant(tenantId: string, orderId: string): Promise<(Order & { payment: Payment | null }) | null>;
  updateStatus(tenantId: string, orderId: string, status: string): Promise<void>;
  listForTenant(
    tenantId: string,
    page: number,
    limit: number,
    filters?: OrderListFilters,
  ): Promise<{ items: Array<Order & { payment: Payment | null }>; total: number }>;
}

export class OrderRepository implements IOrderRepository {
  create(input: CreateOrderInput) {
    return prisma.order.create({
      data: {
        tenantId: input.tenantId,
        channel: input.channel,
        quickpayOrderRef: generateQuickpayOrderRef(),
        amountOre: input.amountOre,
        currency: input.currency,
        status: 'pending',
        customerEmail: input.customerEmail ?? null,
        description: input.description ?? null,
      },
    });
  }

  findByIdForTenant(tenantId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { payment: true },
    });
  }

  updateStatus(tenantId: string, orderId: string, status: string) {
    return prisma.order
      .updateMany({
        where: { id: orderId, tenantId },
        data: { status },
      })
      .then(() => undefined);
  }

  private buildWhere(tenantId: string, filters?: OrderListFilters): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = { tenantId };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.channel) {
      where.channel = filters.channel;
    }
    if (filters?.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { quickpayOrderRef: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async listForTenant(tenantId: string, page: number, limit: number, filters?: OrderListFilters) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = this.buildWhere(tenantId, filters);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { payment: true },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total };
  }
}

export const orderRepository = new OrderRepository();
