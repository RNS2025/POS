import type { MerchantStatus } from '@shared/platform';

const LABELS: Record<MerchantStatus, string> = {
  registered: 'Registered',
  quickpay_connected: 'Quickpay connected',
  clearhaus_pending: 'Awaiting Clearhaus',
  live: 'Live',
  attention: 'Needs attention',
};

export function merchantStatusLabel(status: MerchantStatus): string {
  return LABELS[status];
}
