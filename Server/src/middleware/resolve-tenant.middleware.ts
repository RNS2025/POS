import type { NextFunction, Request, Response } from 'express';
import type { Tenant } from '../generated/prisma/client.js';
import { AppError } from '../infra/app-error.js';
import { tenantRepository } from '../repositories/tenant.repository.js';

export interface TenantRequest extends Request {
  tenant?: Tenant;
}

export function resolveTenantFromSlug(paramName = 'tenantSlug') {
  return async (req: TenantRequest, _res: Response, next: NextFunction) => {
    const slug = req.params[paramName];
    if (!slug) {
      next(new AppError('Shop web address is missing from the URL.', 400));
      return;
    }

    const tenant = await tenantRepository.findBySlug(slug);
    if (!tenant) {
      next(new AppError(`We couldn't find a shop at "${slug}".`, 404));
      return;
    }

    req.tenant = tenant;
    next();
  };
}
