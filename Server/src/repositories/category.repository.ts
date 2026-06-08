import type { Category } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface CreateCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ICategoryRepository {
  listByTenant(tenantId: string, page: number, limit: number): Promise<{ items: Category[]; total: number }>;
  findById(tenantId: string, id: string): Promise<Category | null>;
  create(tenantId: string, data: CreateCategoryInput): Promise<Category>;
  update(tenantId: string, id: string, data: UpdateCategoryInput): Promise<Category | null>;
  countProducts(tenantId: string, id: string): Promise<number>;
  deleteIfEmpty(tenantId: string, id: string): Promise<boolean>;
  listActiveByTenant(tenantId: string): Promise<Category[]>;
}

export class CategoryRepository implements ICategoryRepository {
  listByTenant(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      prisma.category.findMany({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.count({ where: { tenantId } }),
    ]).then(([items, total]) => ({ items, total }));
  }

  listActiveByTenant(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findById(tenantId: string, id: string) {
    return prisma.category.findFirst({ where: { id, tenantId } });
  }

  create(tenantId: string, data: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateCategoryInput) {
    const r = await prisma.category.updateMany({ where: { id, tenantId }, data });
    if (r.count === 0) {
      return null;
    }
    return prisma.category.findFirst({ where: { id, tenantId } });
  }

  countProducts(tenantId: string, id: string) {
    return prisma.product.count({ where: { tenantId, categoryId: id } });
  }

  async deleteIfEmpty(tenantId: string, id: string) {
    const count = await this.countProducts(tenantId, id);
    if (count > 0) {
      return false;
    }
    const result = await prisma.category.deleteMany({ where: { id, tenantId } });
    return result.count > 0;
  }
}

export const categoryRepository = new CategoryRepository();
