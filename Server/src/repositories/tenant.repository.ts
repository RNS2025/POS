import type { Tenant, TenantQuickpayConfig, TenantVerifoneConfig, User } from '../generated/prisma/client.js';
import { prisma } from '../infra/db.js';

export interface ITenantRepository {
  findBySlug(slug: string): Promise<
    | (Tenant & { quickpayConfig: TenantQuickpayConfig | null; verifoneConfig: TenantVerifoneConfig | null })
    | null
  >;
  findById(id: string): Promise<Tenant | null>;
  slugExists(slug: string): Promise<boolean>;
  create(data: { name: string; slug: string }): Promise<Tenant>;
  updateQuickpayConnectedAt(tenantId: string, at: Date | null): Promise<void>;
  updateVerifoneConnectedAt(tenantId: string, at: Date | null): Promise<void>;
}

export class TenantRepository implements ITenantRepository {
  findBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      include: { quickpayConfig: true, verifoneConfig: true },
    });
  }

  findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  }

  slugExists(slug: string) {
    return prisma.tenant
      .findUnique({ where: { slug }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(data: { name: string; slug: string }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data });
      await tx.kasse.create({
        data: {
          tenantId: tenant.id,
          type: 'kiosk',
          name: 'Customer kiosk',
          slug: 'customer',
        },
      });
      return tenant;
    });
  }

  updateQuickpayConnectedAt(tenantId: string, at: Date | null) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { quickpayConnectedAt: at },
    }).then(() => undefined);
  }

  updateVerifoneConnectedAt(tenantId: string, at: Date | null) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { verifoneConnectedAt: at },
    }).then(() => undefined);
  }
}

export const tenantRepository = new TenantRepository();
