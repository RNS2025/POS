import type { Payment } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';
import type { PaymentChannel } from '../types/payment-channel.js';

export interface CreatePaymentInput {
  tenantId: string;
  orderId: string;
  channel: PaymentChannel;
  amountOre: number;
  currency: string;
  quickpayPaymentId?: number;
  quickpayMerchantId?: string;
  verifoneTransactionId?: string;
  verifonePoiTransactionId?: string;
  verifonePoiTimestamp?: Date;
  poiId?: string;
  status?: string;
  paymentLinkUrl?: string;
}

export interface UpdatePaymentRetryInput {
  quickpayPaymentId?: number;
  quickpayMerchantId?: string;
  verifoneTransactionId?: string;
  verifonePoiTransactionId?: string;
  verifonePoiTimestamp?: Date;
  paymentLinkUrl?: string;
  status: string;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>;
  findByQuickpayIdForTenant(tenantId: string, quickpayPaymentId: number): Promise<Payment | null>;
  findByOrderIdForTenant(tenantId: string, orderId: string): Promise<Payment | null>;
  updateStatus(tenantId: string, paymentId: string, status: string): Promise<void>;
  updateForRetry(tenantId: string, paymentId: string, data: UpdatePaymentRetryInput): Promise<void>;
  addRefund(
    tenantId: string,
    paymentId: string,
    refundAmountOre: number,
    orderStatus: string,
    paymentStatus: string,
  ): Promise<void>;
}

export class PaymentRepository implements IPaymentRepository {
  create(input: CreatePaymentInput) {
    return prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        channel: input.channel,
        quickpayPaymentId: input.quickpayPaymentId ?? null,
        quickpayMerchantId: input.quickpayMerchantId ?? null,
        verifoneTransactionId: input.verifoneTransactionId ?? null,
        verifonePoiTransactionId: input.verifonePoiTransactionId ?? null,
        verifonePoiTimestamp: input.verifonePoiTimestamp ?? null,
        poiId: input.poiId ?? null,
        amountOre: input.amountOre,
        currency: input.currency,
        paymentLinkUrl: input.paymentLinkUrl ?? null,
        status: input.status ?? 'pending',
      },
    });
  }

  findByQuickpayIdForTenant(tenantId: string, quickpayPaymentId: number) {
    return prisma.payment.findFirst({
      where: { tenantId, quickpayPaymentId },
    });
  }

  findByOrderIdForTenant(tenantId: string, orderId: string) {
    return prisma.payment.findFirst({
      where: { tenantId, orderId },
    });
  }

  updateStatus(tenantId: string, paymentId: string, status: string) {
    return prisma.payment
      .updateMany({
        where: { id: paymentId, tenantId },
        data: { status },
      })
      .then(() => undefined);
  }

  updateForRetry(tenantId: string, paymentId: string, data: UpdatePaymentRetryInput) {
    return prisma.payment
      .updateMany({
        where: { id: paymentId, tenantId },
        data: {
          status: data.status,
          ...(data.quickpayPaymentId !== undefined
            ? { quickpayPaymentId: data.quickpayPaymentId }
            : {}),
          ...(data.quickpayMerchantId !== undefined
            ? { quickpayMerchantId: data.quickpayMerchantId }
            : {}),
          ...(data.verifoneTransactionId !== undefined
            ? { verifoneTransactionId: data.verifoneTransactionId }
            : {}),
          ...(data.verifonePoiTransactionId !== undefined
            ? { verifonePoiTransactionId: data.verifonePoiTransactionId }
            : {}),
          ...(data.verifonePoiTimestamp !== undefined
            ? { verifonePoiTimestamp: data.verifonePoiTimestamp }
            : {}),
          ...(data.paymentLinkUrl !== undefined ? { paymentLinkUrl: data.paymentLinkUrl } : {}),
        },
      })
      .then(() => undefined);
  }

  addRefund(
    tenantId: string,
    paymentId: string,
    refundAmountOre: number,
    orderStatus: string,
    paymentStatus: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
      });
      if (!payment) {
        return;
      }
      await tx.payment.updateMany({
        where: { id: paymentId, tenantId },
        data: {
          refundedAmountOre: payment.refundedAmountOre + refundAmountOre,
          status: paymentStatus,
        },
      });
      await tx.order.updateMany({
        where: { id: payment.orderId, tenantId },
        data: { status: orderStatus },
      });
    });
  }
}

export const paymentRepository = new PaymentRepository();
