import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import { config } from '../infra/config.js';
import {
  deleteProductImage,
  readProductImage,
  saveProductImage,
  imageContentType,
} from '../infra/product-image.storage.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IKasseRepository } from '../repositories/kasse.repository.js';
import { kasseRepository } from '../repositories/kasse.repository.js';
import type { IProductRepository } from '../repositories/product.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { prisma } from '../infra/db.js';
import { requireStaff } from '../utils/require-staff.js';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  priceOre: z.number().int().min(0),
  categoryId: z.string().uuid().nullable().optional(),
  kasseIds: z.array(z.string().uuid()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  priceOre: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  kasseIds: z.array(z.string().uuid()).optional(),
  removeImage: z.boolean().optional(),
});

function imageUrl(tenantSlug: string, productId: string, imageKey: string | null) {
  if (!imageKey) {
    return null;
  }
  return `${config.apiPublicUrl}/api/v1/tenants/${tenantSlug}/products/${productId}/image`;
}

function toSummary(
  p: {
    id: string;
    name: string;
    priceOre: number;
    categoryId: string | null;
    imageKey: string | null;
    isActive: boolean;
    category: { name: string } | null;
    productKasser: { kasseId: string }[];
  },
  tenantSlug: string,
) {
  return {
    id: p.id,
    name: p.name,
    priceOre: p.priceOre,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    imageUrl: imageUrl(tenantSlug, p.id, p.imageKey),
    isActive: p.isActive,
    kasseIds: p.productKasser.map((pk) => pk.kasseId),
  };
}

export class ProductService {
  constructor(
    private readonly products: IProductRepository = productRepository,
    private readonly kasser: IKasseRepository = kasseRepository,
  ) {}

  async list(auth: JwtPayload, tenant: { id: string; slug: string }, page = 1, limit = 20) {
    requireStaff(auth, tenant.id, tenant.slug);
    const { items, total } = await this.products.listByTenant(tenant.id, page, limit);
    return {
      items: items.map((p) => toSummary(p, tenant.slug)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async get(auth: JwtPayload, tenant: { id: string; slug: string }, id: string) {
    requireStaff(auth, tenant.id, tenant.slug);
    const row = await prisma.product.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        category: { select: { name: true } },
        productKasser: { select: { kasseId: true } },
      },
    });
    if (!row) {
      throw new AppError('Product not found.', 404);
    }
    return toSummary(row, tenant.slug);
  }

  private async defaultKasseIds(tenantId: string): Promise<string[]> {
    const { items } = await this.kasser.listByTenant(tenantId, 1, 100);
    return items.map((k) => k.id);
  }

  async create(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    body: Record<string, unknown>,
    file?: Express.Multer.File,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);
    const data = createSchema.parse({
      name: body.name,
      priceOre: body.priceOre !== undefined ? Number(body.priceOre) : undefined,
      categoryId: body.categoryId === '' || body.categoryId === undefined ? null : body.categoryId,
      kasseIds: body.kasseIds ? JSON.parse(String(body.kasseIds)) : undefined,
    });

    const product = await this.products.create(tenant.id, {
      name: data.name,
      priceOre: data.priceOre,
      categoryId: data.categoryId ?? null,
    });

    if (file) {
      const imageKey = await saveProductImage(tenant.id, product.id, file);
      await this.products.update(tenant.id, product.id, { imageKey });
    }

    const kasseIds = data.kasseIds ?? (await this.defaultKasseIds(tenant.id));
    await this.products.setKasseIds(tenant.id, product.id, kasseIds);

    return this.get(auth, tenant, product.id);
  }

  async update(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    id: string,
    body: Record<string, unknown>,
    file?: Express.Multer.File,
  ) {
    requireStaff(auth, tenant.id, tenant.slug);
    const existing = await this.products.findById(tenant.id, id);
    if (!existing) {
      throw new AppError('Product not found.', 404);
    }

    const data = updateSchema.parse({
      name: body.name,
      priceOre: body.priceOre !== undefined ? Number(body.priceOre) : undefined,
      categoryId: body.categoryId === '' ? null : body.categoryId,
      isActive: body.isActive === 'true' || body.isActive === true ? true : body.isActive === 'false' || body.isActive === false ? false : undefined,
      kasseIds: body.kasseIds ? JSON.parse(String(body.kasseIds)) : undefined,
      removeImage: body.removeImage === 'true' || body.removeImage === true,
    });

    let imageKey = existing.imageKey;
    if (data.removeImage) {
      await deleteProductImage(existing.imageKey);
      imageKey = null;
    }
    if (file) {
      await deleteProductImage(existing.imageKey);
      imageKey = await saveProductImage(tenant.id, id, file);
    }

    await this.products.update(tenant.id, id, {
      name: data.name,
      priceOre: data.priceOre,
      categoryId: data.categoryId,
      isActive: data.isActive,
      imageKey,
    });

    if (data.kasseIds) {
      await this.products.setKasseIds(tenant.id, id, data.kasseIds);
    }

    return this.get(auth, tenant, id);
  }

  async getImage(tenantId: string, tenantSlug: string, productId: string) {
    const p = await this.products.findById(tenantId, productId);
    if (!p?.imageKey) {
      return null;
    }
    const buf = await readProductImage(p.imageKey);
    if (!buf) {
      return null;
    }
    return { buffer: buf, contentType: imageContentType(p.imageKey) };
  }
}

export const productService = new ProductService();
