import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../infra/app-error.js';
import { verifyToken, type JwtPayload } from '../infra/jwt.js';

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

    if (auth.role !== 'admin' || auth.tenantSlug !== slug) {
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

export function requirePlatformAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'platform_admin') {
    next(new AppError('This page is only for RNS platform administrators.', 403));
    return;
  }
  next();
}
