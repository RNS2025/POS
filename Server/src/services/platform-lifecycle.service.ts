import { z } from 'zod';
import { AppError } from '../infra/app-error.js';
import type { JwtPayload } from '../infra/jwt.js';
import type { IPlatformAuditLogRepository } from '../repositories/platform-audit-log.repository.js';
import { platformAuditLogRepository } from '../repositories/platform-audit-log.repository.js';
import type { ITenantLifecycleRepository } from '../repositories/tenant-lifecycle.repository.js';
import { tenantLifecycleRepository } from '../repositories/tenant-lifecycle.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import { platformService } from './platform.service.js';

const archiveSchema = z.object({
  confirmName: z.string().min(1, 'Type the shop name to confirm.'),
});

export class PlatformLifecycleService {
  constructor(
    private readonly lifecycle: ITenantLifecycleRepository = tenantLifecycleRepository,
    private readonly audit: IPlatformAuditLogRepository = platformAuditLogRepository,
  ) {}

  async archiveMerchant(auth: JwtPayload, tenantId: string, input: unknown) {
    if (auth.role !== 'platform_admin') {
      throw new AppError('This action is only for RNS platform administrators.', 403);
    }

    const data = archiveSchema.parse(input);
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError(`No merchant found with id ${tenantId}.`, 404);
    }

    if (tenant.lifecycleStatus === 'archived') {
      throw new AppError('This merchant is already archived.', 409);
    }

    if (data.confirmName.trim() !== tenant.name) {
      throw new AppError('Shop name did not match. Archive was not started.', 400);
    }

    await this.lifecycle.archiveTenant(tenantId);
    await this.audit.create(tenantId, auth.sub, 'archive_merchant');

    const merchant = await platformService.getMerchant(auth, tenantId);
    return { merchant };
  }
}

export const platformLifecycleService = new PlatformLifecycleService();
