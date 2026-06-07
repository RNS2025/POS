import type { OrderStatus } from './checkout.js';

export type { OrderStatus } from './checkout.js';

export type PaymentChannel = 'online' | 'terminal';
export type PaymentActionType = 'retry' | 'refund' | 'void' | 'abort';

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  channel?: PaymentChannel;
  q?: string;
}

export interface OrderListItem {
  id: string;
  quickpayOrderRef: string;
  channel: PaymentChannel;
  amountOre: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: string | null;
  customerEmail: string | null;
  createdAt: string;
}

export interface OrderListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentActionRecord {
  id: string;
  action: PaymentActionType;
  amountOre: number | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface OrderActionHints {
  retry?: string;
  refund?: string;
  void?: string;
  abort?: string;
}

export interface OrderDetailResponse {
  id: string;
  quickpayOrderRef: string;
  channel: PaymentChannel;
  amountOre: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: string | null;
  paymentUrl: string | null;
  refundedAmountOre: number;
  refundableAmountOre: number;
  customerEmail: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  allowedActions: PaymentActionType[];
  actionHints: OrderActionHints;
  paymentActions: PaymentActionRecord[];
}

export interface RetryOrderResponse {
  orderId: string;
  status: OrderStatus;
  paymentUrl?: string;
}

export interface RefundOrderRequest {
  amountOre?: number;
}

export interface RefundOrderResponse {
  orderId: string;
  status: OrderStatus;
  refundedAmountOre: number;
  refundableAmountOre: number;
}

export interface VoidOrderResponse {
  orderId: string;
  status: OrderStatus;
}

export interface AbortSaleResponse {
  orderId: string;
  status: OrderStatus;
}

export interface SyncOrderStatusResponse {
  orderId: string;
  synced: boolean;
  status: OrderStatus;
  paymentStatus: string | null;
}
