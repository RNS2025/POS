import type { MerchantStatus, TenantLifecycleStatus } from '@shared/platform';

const LABELS: Record<MerchantStatus, string> = {
  registered: 'Registered',
  quickpay_connected: 'Quickpay connected',
  live: 'Live',
  attention: 'Needs attention',
};

const LIFECYCLE_LABELS: Record<TenantLifecycleStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

export function merchantStatusLabel(status: MerchantStatus): string {
  return LABELS[status];
}

export function tenantLifecycleLabel(status: TenantLifecycleStatus): string {
  return LIFECYCLE_LABELS[status];
}
