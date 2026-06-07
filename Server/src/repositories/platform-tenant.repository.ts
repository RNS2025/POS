import type { Prisma, Tenant, TenantQuickpayConfig, User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';
import type { MerchantStatus } from '../types/merchant-status.js';
import { isMerchantStatus, MERCHANT_STATUSES } from '../types/merchant-status.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface TenantListParams {
  page: number;
  limit: number;
  search?: string;
  status?: MerchantStatus;
}

const tenantListInclude = {
  quickpayConfig: true,
  users: {
    where: { role: 'admin' },
    take: 1,
    orderBy: { createdAt: 'asc' as const },
    select: { email: true },
  },
  _count: { select: { orders: true } },
  orders: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { createdAt: true },
  },
} satisfies Prisma.TenantInclude;

const tenantDetailInclude = {
  quickpayConfig: true,
  users: {
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' as const },
    select: { id: true, email: true, role: true, createdAt: true },
  },
  platformNotes: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      author: { select: { email: true } },
    },
  },
  _count: { select: { orders: true } },
  orders: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { createdAt: true },
  },
} satisfies Prisma.TenantInclude;

export type TenantListRow = Tenant & {
  quickpayConfig: TenantQuickpayConfig | null;
  users: Pick<User, 'email'>[];
  _count: { orders: number };
  orders: Pick<{ createdAt: Date }, 'createdAt'>[];
};

export type TenantDetailRow = Tenant & {
  quickpayConfig: TenantQuickpayConfig | null;
  users: Pick<User, 'id' | 'email' | 'role' | 'createdAt'>[];
  platformNotes: Array<{
    id: string;
    body: string;
    createdAt: Date;
    author: { email: string };
  }>;
  _count: { orders: number };
  orders: Pick<{ createdAt: Date }, 'createdAt'>[];
};

function statusWhere(status: MerchantStatus): Prisma.TenantWhereInput {
  switch (status) {
    case 'attention':
      return { quickpayConfig: { lastPingOk: false } };
    case 'live':
      return { clearhausConfirmedAt: { not: null } };
    case 'clearhaus_pending':
      return {
        quickpayConnectedAt: { not: null },
        clearhausConfirmedAt: null,
        quickpayConfig: { lastPingOk: true },
      };
    case 'quickpay_connected':
      return {
        quickpayConnectedAt: { not: null },
        clearhausConfirmedAt: null,
        NOT: { quickpayConfig: { lastPingOk: false } },
        OR: [{ quickpayConfig: null }, { quickpayConfig: { lastPingOk: { not: true } } }],
      };
    case 'registered':
      return {
        quickpayConnectedAt: null,
        NOT: { quickpayConfig: { lastPingOk: false } },
      };
    default:
      return {};
  }
}

export interface IPlatformTenantRepository {
  list(params: TenantListParams): Promise<{ items: TenantListRow[]; total: number }>;
  findDetailById(id: string): Promise<TenantDetailRow | null>;
  updateClearhaus(tenantId: string, confirmed: boolean): Promise<void>;
  countByStatus(): Promise<{ total: number; byStatus: Record<MerchantStatus, number> }>;
  getOrderStats(): Promise<{ totalOrders: number; ordersLast7Days: number; capturedOrders: number }>;
}

export class PlatformTenantRepository implements IPlatformTenantRepository {
  async list(params: TenantListParams) {
    const limit = Math.min(Math.max(params.limit, 1), MAX_LIMIT);
    const page = Math.max(params.page, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { users: { some: { email: { contains: q, mode: 'insensitive' }, role: 'admin' } } },
      ];
    }

    if (params.status) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), statusWhere(params.status)];
    }

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: tenantListInclude,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { items, total };
  }

  findDetailById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: tenantDetailInclude,
    });
  }

  updateClearhaus(tenantId: string, confirmed: boolean) {
    return prisma.tenant
      .update({
        where: { id: tenantId },
        data: { clearhausConfirmedAt: confirmed ? new Date() : null },
      })
      .then(() => undefined);
  }

  async countByStatus() {
    const [total, ...statusCounts] = await Promise.all([
      prisma.tenant.count(),
      ...MERCHANT_STATUSES.map((status) => prisma.tenant.count({ where: statusWhere(status) })),
    ]);

    const byStatus = Object.fromEntries(
      MERCHANT_STATUSES.map((status, index) => [status, statusCounts[index] ?? 0]),
    ) as Record<MerchantStatus, number>;

    return { total, byStatus };
  }

  async getOrderStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalOrders, ordersLast7Days, capturedOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.count({ where: { status: 'captured' } }),
    ]);

    return { totalOrders, ordersLast7Days, capturedOrders };
  }
}

export function parseListParams(query: Record<string, unknown>): TenantListParams {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? DEFAULT_LIMIT);
  const search = typeof query.search === 'string' ? query.search : undefined;
  const rawStatus = typeof query.status === 'string' ? query.status : undefined;
  const status = rawStatus && isMerchantStatus(rawStatus) ? rawStatus : undefined;

  return {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    search,
    status,
  };
}

export const platformTenantRepository = new PlatformTenantRepository();
