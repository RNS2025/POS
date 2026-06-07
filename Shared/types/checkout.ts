export type OrderStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export interface CreateCheckoutRequest {
  amountOre: number;
  currency?: string;
  customerEmail?: string;
  description?: string;
}

export interface CreateCheckoutResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: OrderStatus;
  paymentUrl: string;
}

export interface OrderStatusResponse {
  orderId: string;
  amountOre: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: string | null;
  createdAt: string;
}

export interface SyncPaymentResponse {
  orderId: string;
  synced: boolean;
  status: OrderStatus;
  paymentStatus: string | null;
}
