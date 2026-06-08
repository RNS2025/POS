import type { NextFunction, Request, Response } from 'express';
import { isMerchantAdminRole } from '../domain/merchant-permissions.js';
import { AppError } from '../infra/app-error.js';
import { verifyToken, type JwtPayload } from '../infra/jwt.js';
import { prisma } from '../infra/db.js';

export interface AuthenticatedRequest extends Request {
  auth?: JwtPayload;
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('You are not logged in. Open the log in page and try again.', 401));
    return;
  }

  try {
    req.auth = verifyToken(header.slice(7));
    next();
  } catch {
    next(new AppError('Your session expired or is invalid. Please log in again.', 401));
  }
}

export function requireTenantMatch(paramName = 'tenantSlug') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    const slug = req.params[paramName];

    if (!auth) {
      next(new AppError('You are not logged in. Open the log in page and try again.', 401));
      return;
    }

    if (auth.role === 'platform_admin') {
      next();
      return;
    }

    if (!isMerchantAdminRole(auth.role) || auth.tenantSlug !== slug) {
      next(
        new AppError(
          `You are logged in to "${auth.tenantSlug ?? 'another shop'}", not "${slug}". ` +
            'Log in with the correct shop web address.',
          403,
        ),
      );
      return;
    }

    next();
  };
}

export function requirePasswordChanged() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth || auth.role === 'platform_admin' || !isMerchantAdminRole(auth.role)) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { mustChangePassword: true },
    });

    if (user?.mustChangePassword) {
      next(new AppError('Change your password before continuing.', 403, { code: 'must_change_password' }));
      return;
    }

    next();
  };
}

export function requirePlatformAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'platform_admin') {
    next(new AppError('This page is only for RNS platform administrators.', 403));
    return;
  }
  next();
}
