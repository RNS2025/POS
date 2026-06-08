import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IKasseRepository } from '../repositories/kasse.repository.js';
import { kasseRepository } from '../repositories/kasse.repository.js';
import { requireStaff } from '../utils/require-staff.js';

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens.');

const createSchema = z.object({
  type: z.enum(['kiosk', 'register']),
  name: z.string().min(1).max(120),
  slug: slugSchema,
  verifonePoiId: z.string().max(64).optional(),
});

const updateSchema = z.object({
  type: z.enum(['kiosk', 'register']).optional(),
  name: z.string().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  verifonePoiId: z.string().max(64).nullable().optional(),
  payWithQrEnabled: z.boolean().optional(),
  payWithSmsEnabled: z.boolean().optional(),
  payWithLaterEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const productsSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

function toSummary(
  k: Awaited<ReturnType<IKasseRepository['findById']>> & object,
  productCount?: number,
) {
  return {
    id: k.id,
    type: k.type as 'kiosk' | 'register',
    name: k.name,
    slug: k.slug,
    verifonePoiId: k.verifonePoiId,
    payWithQrEnabled: k.payWithQrEnabled,
    payWithSmsEnabled: k.payWithSmsEnabled,
    payWithLaterEnabled: k.payWithLaterEnabled,
    isActive: k.isActive,
    productCount,
  };
}

function assertKioskPaymentMethods(data: {
  type?: string;
  payWithQrEnabled?: boolean;
  payWithSmsEnabled?: boolean;
  payWithLaterEnabled?: boolean;
  verifonePoiId?: string | null;
}) {
  if (data.type !== 'kiosk' && data.type !== undefined) {
    return;
  }
  const qr = data.payWithQrEnabled ?? true;
  const sms = data.payWithSmsEnabled ?? false;
  const later = data.payWithLaterEnabled ?? false;
  const terminal = Boolean(data.verifonePoiId?.trim());
  if (!qr && !sms && !later && !terminal) {
    throw new AppError(
      'Enable at least one payment method or configure a Verifone terminal POI ID.',
      400,
    );
  }
}

export class KasserService {
  constructor(private readonly kasser: IKasseRepository = kasseRepository) {}

  async list(auth: JwtPayload, tenant: { id: string; slug: string }, page = 1, limit = 20) {
    requireStaff(auth, tenant.id, tenant.slug, 'kasser:read');
    const { items, total } = await this.kasser.listByTenant(tenant.id, page, limit);
    const summaries = await Promise.all(
      items.map(async (k) => toSummary(k, await this.kasser.countProducts(tenant.id, k.id))),
    );
    return { items: summaries, total, page, limit, hasMore: page * limit < total };
  }

  async get(auth: JwtPayload, tenant: { id: string; slug: string }, id: string) {
    requireStaff(auth, tenant.id, tenant.slug, 'kasser:read');
    const k = await this.kasser.findById(tenant.id, id);
    if (!k) {
      throw new AppError('Kasse not found.', 404);
    }
    const productCount = await this.kasser.countProducts(tenant.id, id);
    return toSummary(k, productCount);
  }

  async create(auth: JwtPayload, tenant: { id: string; slug: string }, body: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'kasser:write');
    const data = createSchema.parse(body);
    if (data.type === 'kiosk') {
      assertKioskPaymentMethods({ type: 'kiosk', verifonePoiId: data.verifonePoiId });
    }
    const existing = await this.kasser.findBySlug(tenant.id, data.slug);
    if (existing) {
      throw new AppError('A kasse with this link slug already exists.', 409);
    }
    const k = await this.kasser.create(tenant.id, {
      type: data.type,
      name: data.name,
      slug: data.slug,
      verifonePoiId: data.verifonePoiId ?? null,
    });
    return toSummary(k, 0);
  }

  async update(auth: JwtPayload, tenant: { id: string; slug: string }, id: string, body: unknown) {
    requireStaff(auth, tenant.id, tenant.slug, 'kasser:write');
    const data = updateSchema.parse(body);
    const current = await this.kasser.findById(tenant.id, id);
    if (!current) {
      throw new AppError('Kasse not found.', 404);
    }
    const mergedType = data.type ?? current.type;
    assertKioskPaymentMethods({
      type: mergedType,
      payWithQrEnabled: data.payWithQrEnabled ?? current.payWithQrEnabled,
      payWithSmsEnabled: data.payWithSmsEnabled ?? current.payWithSmsEnabled,
      payWithLaterEnabled: data.payWithLaterEnabled ?? current.payWithLaterEnabled,
      verifonePoiId:
        data.verifonePoiId !== undefined ? data.verifonePoiId : current.verifonePoiId,
    });
    if (data.slug && data.slug !== current.slug) {
      const clash = await this.kasser.findBySlug(tenant.id, data.slug);
      if (clash && clash.id !== id) {
        throw new AppError('A kasse with this link slug already exists.', 409);
      }
    }
    const k = await this.kasser.update(tenant.id, id, data);
    if (!k) {
      throw new AppError('Kasse not found.', 404);
    }
    return toSummary(k, await this.kasser.countProducts(tenant.id, id));
  }

  async setProducts(
    auth: JwtPayload,
    tenant: { id: string; slug: string },
    id: string,
    body: unknown,
  ) {
    requireStaff(auth, tenant.id, tenant.slug, 'kasser:write');
    const data = productsSchema.parse(body);
    const k = await this.kasser.findById(tenant.id, id);
    if (!k) {
      throw new AppError('Kasse not found.', 404);
    }
    await this.kasser.setProductIds(tenant.id, id, data.productIds);
    return { productIds: data.productIds };
  }
}

export const kasserService = new KasserService();
