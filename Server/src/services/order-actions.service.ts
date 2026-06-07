import { z } from 'zod';
import {
  actionHints,
  allowedActions,
  assertActionAllowed,
  getRefundableAmountOre,
  refundStatusesAfterAmount,
  type OrderPaymentContext,
} from '../domain/payment-actions.js';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IOrderRepository } from '../repositories/order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { IPaymentActionRepository } from '../repositories/payment-action.repository.js';
import { paymentActionRepository } from '../repositories/payment-action.repository.js';
import type { IPaymentRepository } from '../repositories/payment.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import type { ITenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import { tenantQuickpayConfigRepository } from '../repositories/tenant-quickpay-config.repository.js';
import type { ITenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { tenantVerifoneConfigRepository } from '../repositories/tenant-verifone-config.repository.js';
import { generateQuickpayOrderRef } from './quickpay/quickpay-order-ref.js';
import type { IQuickpayClient } from './quickpay/quickpay.client.js';
import { quickpayClient } from './quickpay/quickpay.client.js';
import type { IVerifoneClient } from './verifone/verifone.client.js';
import { verifoneClient } from './verifone/verifone.client.js';
import { requireStaff } from '../utils/require-staff.js';
import type { OrderStatus, PaymentStatus } from '../types/order-status.js';
import type { PaymentChannel } from '../types/payment-channel.js';

const refundSchema = z.object({
  amountOre: z.number().int().min(1).optional(),
});

function toContext(
  order: {
    channel: string;
    status: string;
    amountOre: number;
    createdAt: Date;
  },
  payment: {
    status: string;
    refundedAmountOre: number;
    updatedAt: Date;
    verifonePoiTransactionId: string | null;
  } | null,
): OrderPaymentContext {
  return {
    channel: order.channel as PaymentChannel,
    orderStatus: order.status as OrderStatus,
    paymentStatus: (payment?.status ?? null) as PaymentStatus | null,
    amountOre: order.amountOre,
    refundedAmountOre: payment?.refundedAmountOre ?? 0,
    orderCreatedAt: order.createdAt,
    paymentUpdatedAt: payment?.updatedAt ?? order.createdAt,
    verifonePoiTransactionId: payment?.verifonePoiTransactionId ?? null,
  };
}

export class OrderActionsService {
  constructor(
    private readonly orders: IOrderRepository = orderRepository,
    private readonly payments: IPaymentRepository = paymentRepository,
    private readonly paymentActions: IPaymentActionRepository = paymentActionRepository,
    private readonly quickpayConfigs: ITenantQuickpayConfigRepository = tenantQuickpayConfigRepository,
    private readonly verifoneConfigs: ITenantVerifoneConfigRepository = tenantVerifoneConfigRepository,
    private readonly quickpay: IQuickpayClient = quickpayClient,
    private readonly verifone: IVerifoneClient = verifoneClient,
  ) {}

  async retry(
    auth: JwtPayload,
    tenant: { id: string; slug: string; quickpayConnectedAt: Date | null; verifoneConnectedAt: Date | null },
    orderId: string,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);

    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    let payment = order.payment;
    const ctx = toContext(order, payment);
    assertActionAllowed('retry', ctx);

    if (order.channel === 'online') {
      if (!tenant.quickpayConnectedAt) {
        throw new AppError('Quickpay is not connected for this shop.', 503);
      }

      const continueUrl = `${config.appPublicUrl}/${tenant.slug}/checkout/success?orderId=${order.id}`;
      const cancelUrl = `${config.appPublicUrl}/${tenant.slug}/checkout/cancel?orderId=${order.id}`;

      const linkInput = {
        orderId: order.quickpayOrderRef,
        amountOre: order.amountOre,
        currency: order.currency,
        continueUrl,
        cancelUrl,
      };

      let link: { quickpayPaymentId: number; paymentUrl: string; merchantId: string };
      try {
        if (payment?.quickpayPaymentId) {
          link = await this.quickpay.refreshPaymentLink(
            tenant.id,
            payment.quickpayPaymentId,
            linkInput,
          );
        } else {
          link = await this.quickpay.createPaymentLink(tenant.id, linkInput);
        }
      } catch (err) {
        if (payment) {
          await this.paymentActions.create({
            tenantId: tenant.id,
            orderId: order.id,
            paymentId: payment.id,
            actorUserId: auth.sub,
            action: 'retry',
            status: 'failed',
            error: err instanceof Error ? err.message : 'Could not create payment link.',
          });
        }
        throw new AppError(
          err instanceof Error ? err.message : 'Could not create payment link.',
          502,
        );
      }

      if (!payment) {
        payment = await this.payments.create({
          tenantId: tenant.id,
          orderId: order.id,
          channel: 'online',
          quickpayPaymentId: link.quickpayPaymentId,
          quickpayMerchantId: link.merchantId,
          amountOre: order.amountOre,
          currency: order.currency,
          paymentLinkUrl: link.paymentUrl,
          status: 'pending',
        });
      } else {
        await this.payments.updateForRetry(tenant.id, payment.id, {
          quickpayPaymentId: link.quickpayPaymentId,
          quickpayMerchantId: link.merchantId,
          paymentLinkUrl: link.paymentUrl,
          status: 'pending',
        });
      }

      await this.orders.updateStatus(tenant.id, order.id, 'pending');
      await this.paymentActions.create({
        tenantId: tenant.id,
        orderId: order.id,
        paymentId: payment.id,
        actorUserId: auth.sub,
        action: 'retry',
        status: 'completed',
        gatewayRef: String(link.quickpayPaymentId),
      });

      return {
        orderId: order.id,
        status: 'pending' as const,
        paymentUrl: link.paymentUrl,
      };
    }

    if (!tenant.verifoneConnectedAt) {
      throw new AppError('Verifone is not connected for this shop.', 503);
    }

    const vfConfig = await this.verifoneConfigs.findByTenantId(tenant.id);
    if (!vfConfig) {
      throw new AppError('Verifone is not set up for this shop.', 503);
    }

    const transactionId = generateQuickpayOrderRef();
    await this.orders.updateStatus(tenant.id, order.id, 'pending');

    if (!payment) {
      payment = await this.payments.create({
        tenantId: tenant.id,
        orderId: order.id,
        channel: 'terminal',
        amountOre: order.amountOre,
        currency: order.currency,
        status: 'pending',
        poiId: vfConfig.poiId,
        verifoneTransactionId: transactionId,
      });
    } else {
      await this.payments.updateForRetry(tenant.id, payment.id, {
        verifoneTransactionId: transactionId,
        status: 'pending',
      });
    }

    const sale = await this.verifone.createSale(tenant.id, {
      transactionId,
      amountOre: order.amountOre,
      currency: order.currency,
    });

    const orderStatus = sale.ok ? 'captured' : 'failed';
    const paymentStatus = sale.ok ? 'captured' : 'failed';

    await this.payments.updateForRetry(tenant.id, payment.id, {
      verifoneTransactionId: sale.transactionId,
      verifonePoiTransactionId: sale.poiTransaction?.transactionId,
      verifonePoiTimestamp: sale.poiTransaction?.timestamp
        ? new Date(sale.poiTransaction.timestamp)
        : undefined,
      status: paymentStatus,
    });
    await this.orders.updateStatus(tenant.id, order.id, orderStatus);

    await this.paymentActions.create({
      tenantId: tenant.id,
      orderId: order.id,
      paymentId: payment.id,
      actorUserId: auth.sub,
      action: 'retry',
      status: sale.ok ? 'completed' : 'failed',
      gatewayRef: sale.transactionId,
      error: sale.error,
    });

    if (!sale.ok) {
      throw new AppError(sale.error ?? 'Payment was not approved on the terminal.', 402, {
        orderId: order.id,
      });
    }

    return { orderId: order.id, status: orderStatus as OrderStatus };
  }

  async refund(
    auth: JwtPayload,
    tenant: { id: string; slug: string; quickpayConnectedAt: Date | null; verifoneConnectedAt: Date | null },
    orderId: string,
    input: unknown,
    idempotencyKey?: string,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);

    if (idempotencyKey) {
      const existing = await this.paymentActions.findByIdempotencyKey(idempotencyKey);
      if (existing && existing.orderId === orderId) {
        const order = await this.orders.findByIdForTenant(tenant.id, orderId);
        if (!order?.payment) {
          throw new AppError('Order not found.', 404);
        }
        return {
          orderId: order.id,
          status: order.status as OrderStatus,
          refundedAmountOre: order.payment.refundedAmountOre,
          refundableAmountOre: getRefundableAmountOre(toContext(order, order.payment)),
        };
      }
    }

    const data = refundSchema.parse(input);
    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order?.payment) {
      throw new AppError('Order not found.', 404);
    }

    const payment = order.payment;
    const ctx = toContext(order, payment);
    assertActionAllowed('refund', ctx);

    const remaining = getRefundableAmountOre(ctx);
    const refundAmount = data.amountOre ?? remaining;
    if (refundAmount > remaining) {
      throw new AppError(`Refund amount exceeds remaining refundable ${remaining} øre.`, 400);
    }

    if (order.channel === 'online') {
      if (!payment.quickpayPaymentId) {
        throw new AppError('No Quickpay payment linked to this order.', 400);
      }
      const result = await this.quickpay.refundPayment(tenant.id, payment.quickpayPaymentId, refundAmount);
      if (!result.ok) {
        await this.paymentActions.create({
          tenantId: tenant.id,
          orderId: order.id,
          paymentId: payment.id,
          actorUserId: auth.sub,
          action: 'refund',
          amountOre: refundAmount,
          status: 'failed',
          error: result.error,
          idempotencyKey,
        });
        throw new AppError(result.error ?? 'Quickpay refund failed.', 502);
      }
    } else {
      if (!payment.verifonePoiTransactionId || !payment.verifonePoiTimestamp) {
        throw new AppError('Original terminal transaction data is missing; cannot refund.', 400);
      }
      const txId = generateQuickpayOrderRef();
      const result = await this.verifone.refundSale(tenant.id, {
        transactionId: txId,
        originalPoiTransaction: {
          transactionId: payment.verifonePoiTransactionId,
          timestamp: payment.verifonePoiTimestamp.toISOString(),
        },
        amountOre: refundAmount,
        currency: order.currency,
      });
      if (!result.ok) {
        await this.paymentActions.create({
          tenantId: tenant.id,
          orderId: order.id,
          paymentId: payment.id,
          actorUserId: auth.sub,
          action: 'refund',
          amountOre: refundAmount,
          status: 'failed',
          error: result.error,
          idempotencyKey,
        });
        throw new AppError(result.error ?? 'Terminal refund failed.', 402);
      }
    }

    const { orderStatus, paymentStatus } = refundStatusesAfterAmount(
      refundAmount,
      payment.refundedAmountOre,
      payment.amountOre,
    );

    await this.payments.addRefund(tenant.id, payment.id, refundAmount, orderStatus, paymentStatus);
    await this.paymentActions.create({
      tenantId: tenant.id,
      orderId: order.id,
      paymentId: payment.id,
      actorUserId: auth.sub,
      action: 'refund',
      amountOre: refundAmount,
      status: 'completed',
      idempotencyKey,
    });

    const updated = await this.orders.findByIdForTenant(tenant.id, orderId);
    const updatedPayment = updated!.payment!;

    return {
      orderId: order.id,
      status: orderStatus,
      refundedAmountOre: updatedPayment.refundedAmountOre,
      refundableAmountOre: getRefundableAmountOre(toContext(updated!, updatedPayment)),
    };
  }

  async voidSale(
    auth: JwtPayload,
    tenant: { id: string; slug: string; verifoneConnectedAt: Date | null },
    orderId: string,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);

    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order?.payment || order.channel !== 'terminal') {
      throw new AppError('Terminal sale not found.', 404);
    }

    const payment = order.payment;
    const ctx = toContext(order, payment);
    assertActionAllowed('void', ctx);

    if (!payment.verifonePoiTransactionId || !payment.verifonePoiTimestamp) {
      throw new AppError('Original terminal transaction data is missing; cannot void.', 400);
    }

    const txId = generateQuickpayOrderRef();
    const result = await this.verifone.reverseSale(tenant.id, {
      transactionId: txId,
      originalPoiTransaction: {
        transactionId: payment.verifonePoiTransactionId,
        timestamp: payment.verifonePoiTimestamp.toISOString(),
      },
      amountOre: order.amountOre,
      currency: order.currency,
    });

    if (!result.ok) {
      await this.paymentActions.create({
        tenantId: tenant.id,
        orderId: order.id,
        paymentId: payment.id,
        actorUserId: auth.sub,
        action: 'void',
        status: 'failed',
        error: result.error,
      });
      throw new AppError(result.error ?? 'Terminal void failed.', 402);
    }

    await this.payments.addRefund(
      tenant.id,
      payment.id,
      order.amountOre - payment.refundedAmountOre,
      'refunded',
      'refunded',
    );
    await this.paymentActions.create({
      tenantId: tenant.id,
      orderId: order.id,
      paymentId: payment.id,
      actorUserId: auth.sub,
      action: 'void',
      status: 'completed',
      gatewayRef: txId,
    });

    return { orderId: order.id, status: 'refunded' as const };
  }

  async abortSale(
    auth: JwtPayload,
    tenant: { id: string; slug: string; verifoneConnectedAt: Date | null },
    orderId: string,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);

    const order = await this.orders.findByIdForTenant(tenant.id, orderId);
    if (!order?.payment || order.channel !== 'terminal') {
      throw new AppError('Terminal sale not found.', 404);
    }

    const payment = order.payment;
    const ctx = toContext(order, payment);
    assertActionAllowed('abort', ctx);

    const saleTxId = payment.verifoneTransactionId ?? order.quickpayOrderRef;
    const result = await this.verifone.abortSale(tenant.id, saleTxId);

    if (!result.ok) {
      await this.paymentActions.create({
        tenantId: tenant.id,
        orderId: order.id,
        paymentId: payment.id,
        actorUserId: auth.sub,
        action: 'abort',
        status: 'failed',
        error: result.error,
      });
      throw new AppError(result.error ?? 'Could not abort terminal payment.', 502);
    }

    await this.orders.updateStatus(tenant.id, order.id, 'cancelled');
    await this.payments.updateStatus(tenant.id, payment.id, 'failed');
    await this.paymentActions.create({
      tenantId: tenant.id,
      orderId: order.id,
      paymentId: payment.id,
      actorUserId: auth.sub,
      action: 'abort',
      status: 'completed',
    });

    return { orderId: order.id, status: 'cancelled' as const };
  }

  async markCancelled(tenantId: string, orderId: string) {
    const order = await this.orders.findByIdForTenant(tenantId, orderId);
    if (!order || order.channel !== 'online') {
      throw new AppError('Order not found.', 404);
    }

    if (order.status !== 'pending' && order.status !== 'failed') {
      return { orderId: order.id, status: order.status };
    }

    await this.orders.updateStatus(tenantId, order.id, 'cancelled');
    if (order.payment) {
      await this.payments.updateStatus(tenantId, order.payment.id, 'failed');
    }

    return { orderId: order.id, status: 'cancelled' as const };
  }

  buildActionMeta(
    order: {
      channel: string;
      status: string;
      amountOre: number;
      createdAt: Date;
    },
    payment: {
      status: string;
      refundedAmountOre: number;
      updatedAt: Date;
      verifonePoiTransactionId: string | null;
    } | null,
  ) {
    const ctx = toContext(order, payment);
    return {
      allowedActions: allowedActions(ctx),
      actionHints: actionHints(ctx),
      refundableAmountOre: getRefundableAmountOre(ctx),
    };
  }
}

export const orderActionsService = new OrderActionsService();
