import { AppError } from '../infra/app-error.js';
import type { OrderStatus, PaymentStatus } from '../types/order-status.js';
import type { PaymentChannel } from '../types/payment-channel.js';

export type PaymentActionType = 'retry' | 'refund' | 'void' | 'abort';

export const STALE_PENDING_MINUTES = 15;
export const VOID_WINDOW_HOURS = 24;

export interface OrderPaymentContext {
  channel: PaymentChannel;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus | null;
  amountOre: number;
  refundedAmountOre: number;
  orderCreatedAt: Date;
  paymentUpdatedAt: Date;
  verifonePoiTransactionId: string | null;
}

export interface OrderActionHints {
  retry?: string;
  refund?: string;
  void?: string;
  abort?: string;
}

function isStalePending(ctx: OrderPaymentContext): boolean {
  if (ctx.orderStatus !== 'pending') {
    return false;
  }
  const ageMs = Date.now() - ctx.orderCreatedAt.getTime();
  return ageMs > STALE_PENDING_MINUTES * 60 * 1000;
}

function refundableAmountOre(ctx: OrderPaymentContext): number {
  return Math.max(0, ctx.amountOre - ctx.refundedAmountOre);
}

function canVoidTerminal(ctx: OrderPaymentContext): boolean {
  if (ctx.channel !== 'terminal' || ctx.orderStatus !== 'captured') {
    return false;
  }
  if (!ctx.verifonePoiTransactionId) {
    return false;
  }
  const ageMs = Date.now() - ctx.paymentUpdatedAt.getTime();
  return ageMs <= VOID_WINDOW_HOURS * 60 * 60 * 1000;
}

export function getRefundableAmountOre(ctx: OrderPaymentContext): number {
  return refundableAmountOre(ctx);
}

export function allowedActions(ctx: OrderPaymentContext): PaymentActionType[] {
  const actions: PaymentActionType[] = [];
  const status = ctx.orderStatus;
  const paymentStatus = ctx.paymentStatus;

  if (ctx.channel === 'online') {
    if (status === 'failed' || status === 'cancelled' || isStalePending(ctx)) {
      actions.push('retry');
    }
    if (
      (status === 'captured' || status === 'partially_refunded') &&
      (paymentStatus === 'captured' || paymentStatus === 'partially_refunded') &&
      refundableAmountOre(ctx) > 0
    ) {
      actions.push('refund');
    }
  }

  if (ctx.channel === 'terminal') {
    if (status === 'pending' && paymentStatus === 'pending') {
      actions.push('abort');
    }
    if (status === 'failed') {
      actions.push('retry');
    }
    if (
      (status === 'captured' || status === 'partially_refunded') &&
      refundableAmountOre(ctx) > 0
    ) {
      actions.push('refund');
    }
    if (canVoidTerminal(ctx)) {
      actions.push('void');
    }
  }

  return actions;
}

export function actionHints(ctx: OrderPaymentContext): OrderActionHints {
  const hints: OrderActionHints = {};
  const allowed = allowedActions(ctx);
  const remaining = refundableAmountOre(ctx);

  if (allowed.includes('retry')) {
    hints.retry =
      ctx.channel === 'online'
        ? 'Refresh the Quickpay payment link for this order (same payment, new link).'
        : 'Try charging the card again on the terminal.';
  }
  if (allowed.includes('refund') && remaining > 0) {
    hints.refund = `Refund up to ${(remaining / 100).toFixed(2)} remaining.`;
  }
  if (allowed.includes('void')) {
    hints.void = 'Void this sale on the terminal (same-day reversal).';
  }
  if (allowed.includes('abort')) {
    hints.abort = 'Cancel the in-progress terminal payment.';
  }

  return hints;
}

export function assertActionAllowed(action: PaymentActionType, ctx: OrderPaymentContext): void {
  if (!allowedActions(ctx).includes(action)) {
    throw new AppError(`Action "${action}" is not allowed for this order in its current state.`, 409);
  }
}

export function refundStatusesAfterAmount(
  amountOre: number,
  refundedAmountOre: number,
  totalAmountOre: number,
): { orderStatus: OrderStatus; paymentStatus: PaymentStatus } {
  const newRefunded = refundedAmountOre + amountOre;
  if (newRefunded >= totalAmountOre) {
    return { orderStatus: 'refunded', paymentStatus: 'refunded' };
  }
  return { orderStatus: 'partially_refunded', paymentStatus: 'partially_refunded' };
}
