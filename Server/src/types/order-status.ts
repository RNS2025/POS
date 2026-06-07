export type OrderStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'authorized',
  'captured',
  'failed',
  'cancelled',
  'partially_refunded',
  'refunded',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'authorized',
  'captured',
  'failed',
  'partially_refunded',
  'refunded',
];
