import type { NextFunction, Response } from 'express';
import type { Kasse } from '../generated/prisma/client.js';
import { AppError } from '../infra/app-error.js';
import { kasseRepository } from '../repositories/kasse.repository.js';
import type { TenantRequest } from './resolve-tenant.middleware.js';

export interface RegisterKasseRequest extends TenantRequest {
  kasse?: Kasse;
}

export function resolveRegisterKasse(paramName = 'kasseSlug') {
  return async (req: RegisterKasseRequest, _res: Response, next: NextFunction) => {
    const tenant = req.tenant;
    if (!tenant) {
      next(new AppError('Shop context is missing.', 500));
      return;
    }

    const slug = req.params[paramName];
    if (!slug) {
      next(new AppError('Register link is missing from the URL.', 400));
      return;
    }

    const kasse = await kasseRepository.findBySlug(tenant.id, slug);
    if (!kasse || kasse.type !== 'register') {
      next(new AppError('Register not found.', 404));
      return;
    }
    if (!kasse.isActive) {
      next(new AppError('This register is not active.', 404));
      return;
    }

    req.kasse = kasse;
    next();
  };
}
