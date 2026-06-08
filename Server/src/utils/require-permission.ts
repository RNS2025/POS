import type { AdminPermission } from '../domain/merchant-permissions.js';
import { hasPermission, isMerchantAdminRole } from '../domain/merchant-permissions.js';
import type { JwtPayload } from '../infra/jwt.js';
import { AppError } from '../infra/app-error.js';

export { hasPermission, isMerchantAdminRole };

export function requireMerchantAdmin(
  auth: JwtPayload,
  tenantId: string,
  tenantSlug: string,
  message = 'You must be logged in as a shop admin.',
): void {
  if (auth.role === 'platform_admin') {
    return;
  }
  if (
    !isMerchantAdminRole(auth.role) ||
    auth.tenantId !== tenantId ||
    auth.tenantSlug !== tenantSlug
  ) {
    throw new AppError(message, 403);
  }
}

export function requirePermission(
  auth: JwtPayload,
  permission: AdminPermission,
  message = 'You do not have access to this.',
): void {
  if (auth.role === 'platform_admin') {
    return;
  }
  if (!hasPermission(auth.role, permission)) {
    throw new AppError(message, 403);
  }
}

export function requireMerchantPermission(
  auth: JwtPayload,
  tenantId: string,
  tenantSlug: string,
  permission: AdminPermission,
): void {
  requireMerchantAdmin(auth, tenantId, tenantSlug);
  requirePermission(auth, permission);
}
