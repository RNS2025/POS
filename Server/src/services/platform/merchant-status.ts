import type { MerchantStatus } from '../../types/merchant-status.js';
import type { Tenant, TenantQuickpayConfig, User } from '../../generated/prisma/client.js';

type TenantWithRelations = Tenant & {
  quickpayConfig: TenantQuickpayConfig | null;
  users: Pick<User, 'email'>[];
  _count?: { orders: number };
  orders?: Pick<{ createdAt: Date }, 'createdAt'>[];
};

export function merchantActivity(tenant: {
  _count?: { orders: number };
  orders?: Pick<{ createdAt: Date }, 'createdAt'>[];
}) {
  return {
    orderCount: tenant._count?.orders ?? 0,
    lastOrderAt: tenant.orders?.[0]?.createdAt.toISOString() ?? null,
  };
}

export function deriveMerchantStatus(tenant: {
  quickpayConnectedAt: Date | null;
  quickpayConfig: Pick<TenantQuickpayConfig, 'lastPingOk'> | null;
}): MerchantStatus {
  const pingOk = tenant.quickpayConfig?.lastPingOk === true;
  const pingFailed = tenant.quickpayConfig?.lastPingOk === false;

  if (pingFailed) {
    return 'attention';
  }
  if (tenant.quickpayConnectedAt && pingOk) {
    return 'live';
  }
  if (tenant.quickpayConnectedAt) {
    return 'quickpay_connected';
  }
  return 'registered';
}

export function toMerchantSummary(tenant: TenantWithRelations): {
  id: string;
  name: string;
  slug: string;
  status: MerchantStatus;
  createdAt: string;
  quickpayConnectedAt: string | null;
  quickpayConfigured: boolean;
  lastPingAt: string | null;
  lastPingOk: boolean | null;
  lastPingError: string | null;
  primaryContactEmail: string | null;
  orderCount: number;
  lastOrderAt: string | null;
} {
  const cfg = tenant.quickpayConfig;
  const activity = merchantActivity(tenant);
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: deriveMerchantStatus(tenant),
    createdAt: tenant.createdAt.toISOString(),
    quickpayConnectedAt: tenant.quickpayConnectedAt?.toISOString() ?? null,
    quickpayConfigured: cfg !== null,
    lastPingAt: cfg?.lastPingAt?.toISOString() ?? null,
    lastPingOk: cfg?.lastPingOk ?? null,
    lastPingError: cfg?.lastPingError ?? null,
    primaryContactEmail: tenant.users[0]?.email ?? null,
    orderCount: activity.orderCount,
    lastOrderAt: activity.lastOrderAt,
  };
}
