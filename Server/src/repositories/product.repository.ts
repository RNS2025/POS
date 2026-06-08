import type { Product } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface CreateProductInput {
  name: string;
  priceOre: number;
  categoryId?: string | null;
  imageKey?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  priceOre?: number;
  categoryId?: string | null;
  imageKey?: string | null;
  isActive?: boolean;
}

export interface IProductRepository {
  listByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Array<Product & { category: { name: string } | null; productKasser: { kasseId: string }[] }>; total: number }>;
  findById(tenantId: string, id: string): Promise<Product | null>;
  create(tenantId: string, data: CreateProductInput): Promise<Product>;
  update(tenantId: string, id: string, data: UpdateProductInput): Promise<Product | null>;
  setKasseIds(tenantId: string, productId: string, kasseIds: string[]): Promise<void>;
}

export class ProductRepository implements IProductRepository {
  listByTenant(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      prisma.product.findMany({
        where: { tenantId },
        include: {
          category: { select: { name: true } },
          productKasser: { select: { kasseId: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: { tenantId } }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findById(tenantId: string, id: string) {
    return prisma.product.findFirst({ where: { id, tenantId } });
  }

  create(tenantId: string, data: CreateProductInput) {
    return prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        priceOre: data.priceOre,
        categoryId: data.categoryId ?? null,
        imageKey: data.imageKey ?? null,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateProductInput) {
    const r = await prisma.product.updateMany({ where: { id, tenantId }, data });
    if (r.count === 0) {
      return null;
    }
    return prisma.product.findFirst({ where: { id, tenantId } });
  }

  async setKasseIds(tenantId: string, productId: string, kasseIds: string[]) {
    await prisma.$transaction([
      prisma.productKasse.deleteMany({ where: { tenantId, productId } }),
      ...(kasseIds.length > 0
        ? [
            prisma.productKasse.createMany({
              data: kasseIds.map((kasseId) => ({ tenantId, productId, kasseId })),
            }),
          ]
        : []),
    ]);
  }
}

export const productRepository = new ProductRepository();
