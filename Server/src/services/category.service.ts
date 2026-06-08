import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { ICategoryRepository } from '../repositories/category.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { requireStaff } from '../utils/require-staff.js';

const createSchema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

async function toSummary(
  c: NonNullable<Awaited<ReturnType<ICategoryRepository['findById']>>>,
  repo: ICategoryRepository,
  tenantId: string,
) {
  return {
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: await repo.countProducts(tenantId, c.id),
  };
}

export class CategoryService {
  constructor(private readonly categories: ICategoryRepository = categoryRepository) {}

  async list(auth: JwtPayload, tenant: { id: string; slug: string }, page = 1, limit = 50) {
    requireStaff(auth, tenant.id, tenant.slug, 'categories:read');
    const { items, total } = await this.categories.listByTenant(tenant.id, page, limit);
    const summaries = await Promise.all(
      items.map((c) => toSummary(c, this.categories, tenant.id)),
    );
    return { items: summaries, total, page, limit, hasMore: page * limit < total };
  }

  async get(auth: JwtPayload, tenant: { id: string; slug: string }, id: string) {
    requireStaff(auth, tenant.id, tenant.slug, 'categories:read');
    const c = await this.categories.findById(tenant.id, id);
    if (!c) {
      throw new AppError('Category not found.', 404);
    }
    return toSummary(c, this.categories, tenant.id);
  }

  async create(auth: JwtPayload, tenant: { id: string; slug: string }, body: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'categories:write');
    const data = createSchema.parse(body);
    const c = await this.categories.create(tenant.id, data);
    return toSummary(c, this.categories, tenant.id);
  }

  async update(auth: JwtPayload, tenant: { id: string; slug: string }, id: string, body: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'categories:write');
    const data = updateSchema.parse(body);
    const c = await this.categories.update(tenant.id, id, data);
    if (!c) {
      throw new AppError('Category not found.', 404);
    }
    return toSummary(c, this.categories, tenant.id);
  }

  async delete(auth: JwtPayload, tenant: { id: string; slug: string }, id: string) {
    requireStaff(auth, tenant.id, tenant.slug, 'categories:write');
    const count = await this.categories.countProducts(tenant.id, id);
    if (count > 0) {
      throw new AppError('Cannot delete category with products. Deactivate instead.', 409);
    }
    const ok = await this.categories.deleteIfEmpty(tenant.id, id);
    if (!ok) {
      throw new AppError('Category not found.', 404);
    }
    return { deleted: true };
  }
}

export const categoryService = new CategoryService();
