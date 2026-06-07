import type { JwtPayload } from '../infra/jwt.js';
import { AppError } from '../infra/app-error.js';

export function requireStaff(
  auth: JwtPayload,
  tenantId: string,
  tenantSlug: string,
  message = 'You must be logged in as shop staff.',
): void {
  if (auth.role === 'platform_admin') {
    return;
  }
  if (auth.role !== 'admin' || auth.tenantId !== tenantId || auth.tenantSlug !== tenantSlug) {
    throw new AppError(message, 403);
  }
}
