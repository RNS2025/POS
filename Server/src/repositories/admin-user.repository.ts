import type { User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

const MERCHANT_ADMIN_ROLES = ['owner', 'manager', 'viewer'] as const;

export interface IAdminUserRepository {
  listByTenant(tenantId: string, page: number, limit: number): Promise<{ items: User[]; total: number }>;
  findById(tenantId: string, id: string): Promise<User | null>;
  countActiveOwners(tenantId: string, excludeUserId?: string): Promise<number>;
  create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: string;
    mustChangePassword: boolean;
  }): Promise<User>;
  update(
    tenantId: string,
    id: string,
    data: {
      displayName?: string;
      role?: string;
      isActive?: boolean;
      passwordHash?: string;
      mustChangePassword?: boolean;
    },
  ): Promise<User | null>;
}

export class AdminUserRepository implements IAdminUserRepository {
  listByTenant(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { tenantId, role: { in: [...MERCHANT_ADMIN_ROLES] } };
    return Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findById(tenantId: string, id: string) {
    return prisma.user.findFirst({
      where: { id, tenantId, role: { in: [...MERCHANT_ADMIN_ROLES] } },
    });
  }

  countActiveOwners(tenantId: string, excludeUserId?: string) {
    return prisma.user.count({
      where: {
        tenantId,
        role: 'owner',
        isActive: true,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });
  }

  create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: string;
    mustChangePassword: boolean;
  }) {
    return prisma.user.create({ data });
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      displayName?: string;
      role?: string;
      isActive?: boolean;
      passwordHash?: string;
      mustChangePassword?: boolean;
    },
  ) {
    const r = await prisma.user.updateMany({
      where: { id, tenantId, role: { in: [...MERCHANT_ADMIN_ROLES] } },
      data,
    });
    if (r.count === 0) {
      return null;
    }
    return this.findById(tenantId, id);
  }
}

export const adminUserRepository = new AdminUserRepository();
