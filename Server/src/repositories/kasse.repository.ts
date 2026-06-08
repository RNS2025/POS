import type { Kasse } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface CreateKasseInput {
  type: string;
  name: string;
  slug: string;
  verifonePoiId?: string | null;
}

export interface UpdateKasseInput {
  type?: string;
  name?: string;
  slug?: string;
  verifonePoiId?: string | null;
  payWithQrEnabled?: boolean;
  payWithSmsEnabled?: boolean;
  payWithLaterEnabled?: boolean;
  isActive?: boolean;
}

export interface IKasseRepository {
  listByTenant(tenantId: string, page: number, limit: number): Promise<{ items: Kasse[]; total: number }>;
  findById(tenantId: string, id: string): Promise<Kasse | null>;
  findBySlug(tenantId: string, slug: string): Promise<Kasse | null>;
  create(tenantId: string, data: CreateKasseInput): Promise<Kasse>;
  update(tenantId: string, id: string, data: UpdateKasseInput): Promise<Kasse | null>;
  setProductIds(tenantId: string, kasseId: string, productIds: string[]): Promise<void>;
  countProducts(tenantId: string, kasseId: string): Promise<number>;
}

export class KasseRepository implements IKasseRepository {
  listByTenant(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      prisma.kasse.findMany({
        where: { tenantId },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.kasse.count({ where: { tenantId } }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findById(tenantId: string, id: string) {
    return prisma.kasse.findFirst({ where: { id, tenantId } });
  }

  findBySlug(tenantId: string, slug: string) {
    return prisma.kasse.findFirst({ where: { tenantId, slug } });
  }

  create(tenantId: string, data: CreateKasseInput) {
    return prisma.kasse.create({
      data: {
        tenantId,
        type: data.type,
        name: data.name,
        slug: data.slug,
        verifonePoiId: data.verifonePoiId ?? null,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateKasseInput) {
    const r = await prisma.kasse.updateMany({ where: { id, tenantId }, data });
    if (r.count === 0) {
      return null;
    }
    return prisma.kasse.findFirst({ where: { id, tenantId } });
  }

  async setProductIds(tenantId: string, kasseId: string, productIds: string[]) {
    await prisma.$transaction([
      prisma.productKasse.deleteMany({ where: { tenantId, kasseId } }),
      ...(productIds.length > 0
        ? [
            prisma.productKasse.createMany({
              data: productIds.map((productId) => ({ tenantId, productId, kasseId })),
            }),
          ]
        : []),
    ]);
  }

  countProducts(tenantId: string, kasseId: string) {
    return prisma.productKasse.count({ where: { tenantId, kasseId } });
  }
}

export const kasseRepository = new KasseRepository();
