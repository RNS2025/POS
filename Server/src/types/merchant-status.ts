export type MerchantStatus =
  | 'registered'
  | 'quickpay_connected'
  | 'live'
  | 'attention';

export const MERCHANT_STATUSES: MerchantStatus[] = [
  'registered',
  'quickpay_connected',
  'live',
  'attention',
];

export function isMerchantStatus(value: string): value is MerchantStatus {
  return (MERCHANT_STATUSES as string[]).includes(value);
}
