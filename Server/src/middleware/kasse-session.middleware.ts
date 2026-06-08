import type { NextFunction, Response } from 'express';
import { AppError } from '../infra/app-error.js';
import { verifyToken, type JwtPayload } from '../infra/jwt.js';
import type { RegisterKasseRequest } from './resolve-register-kasse.middleware.js';

export interface KasseSessionRequest extends RegisterKasseRequest {
  kasseSession?: JwtPayload;
}

export function requireKasseSession(req: KasseSessionRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Enter your PIN to open the register.', 401));
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    if (payload.role !== 'kasse_staff') {
      next(new AppError('This action requires a register PIN session.', 403));
      return;
    }
    if (!payload.kasseId || !payload.tenantId || payload.tenantId !== req.tenant?.id) {
      next(new AppError('Register session does not match this shop.', 403));
      return;
    }
    if (req.kasse && payload.kasseId !== req.kasse.id) {
      next(new AppError('Register session does not match this register.', 403));
      return;
    }
    req.kasseSession = payload;
    next();
  } catch {
    next(new AppError('Your register session expired. Enter your PIN again.', 401));
  }
}
