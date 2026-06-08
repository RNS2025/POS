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
  customerPhone?: string;
  paymentMethod?: string;
  kasseId?: string;
  staffUserId?: string;
  status?: string;
  description?: string;
}

export interface CreateOrderLineInput {
  productId: string | null;
  nameSnapshot: string;
  unitPriceOre: number;
  quantity: number;
  lineTotalOre: number;
}

export interface OrderListFilters {
  status?: string;
  channel?: string;
  kasseId?: string;
  staffUserId?: string;
  paymentMethod?: string;
  q?: string;
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  createWithLineItems(input: CreateOrderInput, lines: CreateOrderLineInput[]): Promise<Order>;
  findByIdForTenant(tenantId: string, orderId: string): Promise<(Order & { payment: Payment | null }) | null>;
  findByIdWithLines(
    tenantId: string,
    orderId: string,
  ): Promise<(Order & { payment: Payment | null; lineItems: Array<{ nameSnapshot: string; quantity: number; lineTotalOre: number }> }) | null>;
  findDetailForTenant(
    tenantId: string,
    orderId: string,
  ): Promise<
    | (Order & {
        payment: Payment | null;
        kasse: { id: string; name: string; slug: string; type: string } | null;
        staffUser: { id: string; displayName: string | null } | null;
        lineItems: Array<{
          nameSnapshot: string;
          quantity: number;
          unitPriceOre: number;
          lineTotalOre: number;
        }>;
      })
    | null
  >;
  updateStatus(tenantId: string, orderId: string, status: string): Promise<void>;
  listForTenant(
    tenantId: string,
    page: number,
    limit: number,
    filters?: OrderListFilters,
  ): Promise<{
    items: Array<
      Order & {
        payment: Payment | null;
        kasse: { name: string; slug: string } | null;
        staffUser: { displayName: string | null } | null;
      }
    >;
    total: number;
  }>;
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
        customerPhone: input.customerPhone ?? null,
        paymentMethod: input.paymentMethod ?? null,
        kasseId: input.kasseId ?? null,
        staffUserId: input.staffUserId ?? null,
        description: input.description ?? null,
      },
    });
  }

  createWithLineItems(input: CreateOrderInput, lines: CreateOrderLineInput[]) {
    const ref = generateQuickpayOrderRef();
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tenantId: input.tenantId,
          channel: input.channel,
          quickpayOrderRef: ref,
          amountOre: input.amountOre,
          currency: input.currency,
          status: input.status ?? 'pending',
          customerEmail: input.customerEmail ?? null,
          customerPhone: input.customerPhone ?? null,
          paymentMethod: input.paymentMethod ?? null,
          kasseId: input.kasseId ?? null,
          staffUserId: input.staffUserId ?? null,
          description: input.description ?? null,
        },
      });
      if (lines.length > 0) {
        await tx.orderLineItem.createMany({
          data: lines.map((line) => ({
            tenantId: input.tenantId,
            orderId: order.id,
            productId: line.productId,
            nameSnapshot: line.nameSnapshot,
            unitPriceOre: line.unitPriceOre,
            quantity: line.quantity,
            lineTotalOre: line.lineTotalOre,
          })),
        });
      }
      return order;
    });
  }

  findByIdForTenant(tenantId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { payment: true },
    });
  }

  findByIdWithLines(tenantId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        payment: true,
        lineItems: {
          select: { nameSnapshot: true, quantity: true, lineTotalOre: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findDetailForTenant(tenantId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        payment: true,
        kasse: { select: { id: true, name: true, slug: true, type: true } },
        staffUser: { select: { id: true, displayName: true } },
        lineItems: {
          select: {
            nameSnapshot: true,
            quantity: true,
            unitPriceOre: true,
            lineTotalOre: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
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
    if (filters?.kasseId) {
      where.kasseId = filters.kasseId;
    }
    if (filters?.staffUserId) {
      where.staffUserId = filters.staffUserId;
    }
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
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
        include: {
          payment: true,
          kasse: { select: { name: true, slug: true } },
          staffUser: { select: { displayName: true } },
        },
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
