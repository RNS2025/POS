import { prisma } from '../infra/db.js';

export interface ITenantLifecycleRepository {
  archiveTenant(tenantId: string): Promise<void>;
}

export class TenantLifecycleRepository implements ITenantLifecycleRepository {
  archiveTenant(tenantId: string) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          lifecycleStatus: 'archived',
          archivedAt: now,
          quickpayConnectedAt: null,
          verifoneConnectedAt: null,
        },
      });

      await tx.user.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });

      await tx.tenantInvite.deleteMany({ where: { tenantId } });
      await tx.tenantQuickpayConfig.deleteMany({ where: { tenantId } });
      await tx.tenantVerifoneConfig.deleteMany({ where: { tenantId } });
      await tx.kasse.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });
    });
  }
}

export const tenantLifecycleRepository = new TenantLifecycleRepository();
