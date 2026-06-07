import type { OrderStatus, PaymentStatus } from '../../types/order-status.js';

export interface QuickpayOperation {
  id: number;
  type: string;
  qp_status_code?: string;
  pending?: boolean;
  amount?: number;
}

export interface QuickpayCallbackPayment {
  id: number;
  merchant_id: number;
  order_id: string;
  accepted?: boolean;
  state?: string;
  operations?: QuickpayOperation[];
}

export function mapQuickpayToStatuses(
  payment: QuickpayCallbackPayment,
  currentRefundedAmountOre = 0,
  totalAmountOre = 0,
): {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  refundedAmountOre?: number;
} {
  const ops = payment.operations ?? [];

  const approvedRefunds = ops.filter(
    (op) => op.type === 'refund' && op.qp_status_code === '20000' && op.pending !== true,
  );
  if (approvedRefunds.length > 0) {
    const webhookRefunded = approvedRefunds.reduce((sum, op) => sum + (op.amount ?? 0), 0);
    const refundedAmountOre = Math.max(currentRefundedAmountOre, webhookRefunded);
    if (totalAmountOre > 0 && refundedAmountOre >= totalAmountOre) {
      return { orderStatus: 'refunded', paymentStatus: 'refunded', refundedAmountOre };
    }
    if (refundedAmountOre > 0) {
      return {
        orderStatus: 'partially_refunded',
        paymentStatus: 'partially_refunded',
        refundedAmountOre,
      };
    }
  }

  const hasApprovedCapture = ops.some(
    (op) => op.type === 'capture' && op.qp_status_code === '20000' && op.pending !== true,
  );
  if (hasApprovedCapture || payment.state === 'processed') {
    return { orderStatus: 'captured', paymentStatus: 'captured' };
  }

  const hasApprovedAuthorize = ops.some(
    (op) => op.type === 'authorize' && op.qp_status_code === '20000' && op.pending !== true,
  );
  if (hasApprovedAuthorize || payment.state === 'authorized') {
    return { orderStatus: 'authorized', paymentStatus: 'authorized' };
  }

  if (payment.accepted === false || payment.state === 'rejected') {
    return { orderStatus: 'failed', paymentStatus: 'failed' };
  }

  if (payment.state === 'cancelled') {
    return { orderStatus: 'cancelled', paymentStatus: 'failed' };
  }

  return { orderStatus: 'pending', paymentStatus: 'pending' };
}

export function merchantIdsMatch(storedMerchantId: string, payloadMerchantId: number): boolean {
  return storedMerchantId.trim() === String(payloadMerchantId);
}
