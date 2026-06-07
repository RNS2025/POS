import type { PaymentAction } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface CreatePaymentActionInput {
  tenantId: string;
  orderId: string;
  paymentId: string;
  actorUserId?: string;
  action: string;
  amountOre?: number;
  status: string;
  gatewayRef?: string;
  error?: string;
  idempotencyKey?: string;
}

export interface IPaymentActionRepository {
  create(input: CreatePaymentActionInput): Promise<PaymentAction>;
  findByIdempotencyKey(key: string): Promise<PaymentAction | null>;
  listForOrder(tenantId: string, orderId: string): Promise<PaymentAction[]>;
}

export class PaymentActionRepository implements IPaymentActionRepository {
  create(input: CreatePaymentActionInput) {
    return prisma.paymentAction.create({
      data: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        paymentId: input.paymentId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        amountOre: input.amountOre ?? null,
        status: input.status,
        gatewayRef: input.gatewayRef ?? null,
        error: input.error ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });
  }

  findByIdempotencyKey(key: string) {
    return prisma.paymentAction.findUnique({ where: { idempotencyKey: key } });
  }

  listForOrder(tenantId: string, orderId: string) {
    return prisma.paymentAction.findMany({
      where: { tenantId, orderId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const paymentActionRepository = new PaymentActionRepository();
