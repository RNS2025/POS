import type { User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface IStaffRepository {
  listByTenant(tenantId: string, page: number, limit: number): Promise<{ items: User[]; total: number }>;
  findById(tenantId: string, id: string): Promise<User | null>;
  create(data: {
    tenantId: string;
    email: string;
    displayName: string;
    pinHash: string;
  }): Promise<User>;
  update(
    tenantId: string,
    id: string,
    data: { displayName?: string; pinHash?: string; passwordHash?: string; isActive?: boolean },
  ): Promise<User | null>;
  listActiveWithPin(tenantId: string): Promise<User[]>;
}

export class StaffRepository implements IStaffRepository {
  listByTenant(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { tenantId, role: 'staff' };
    return Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { displayName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findById(tenantId: string, id: string) {
    return prisma.user.findFirst({ where: { id, tenantId, role: 'staff' } });
  }

  create(data: { tenantId: string; email: string; displayName: string; pinHash: string }) {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        passwordHash: data.pinHash,
        pinHash: data.pinHash,
        role: 'staff',
        displayName: data.displayName,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { displayName?: string; pinHash?: string; passwordHash?: string; isActive?: boolean },
  ) {
    const r = await prisma.user.updateMany({
      where: { id, tenantId, role: 'staff' },
      data,
    });
    if (r.count === 0) {
      return null;
    }
    return prisma.user.findFirst({ where: { id, tenantId, role: 'staff' } });
  }

  listActiveWithPin(tenantId: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        role: 'staff',
        isActive: true,
        pinHash: { not: null },
      },
    });
  }
}

export const staffRepository = new StaffRepository();
