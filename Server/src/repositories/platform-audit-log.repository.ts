import { prisma } from '../infra/db.js';

export interface IPlatformAuditLogRepository {
  create(tenantId: string, actorId: string, action: string): Promise<void>;
}

export class PlatformAuditLogRepository implements IPlatformAuditLogRepository {
  create(tenantId: string, actorId: string, action: string) {
    return prisma.platformAuditLog
      .create({
        data: { tenantId, actorId, action },
      })
      .then(() => undefined);
  }
}

export const platformAuditLogRepository = new PlatformAuditLogRepository();
