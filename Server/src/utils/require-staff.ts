import type { JwtPayload } from '../infra/jwt.js';
import type { AdminPermission } from '../domain/merchant-permissions.js';
import { requireMerchantPermission } from './require-permission.js';

/** @deprecated Use requireMerchantPermission with a specific permission. */
export function requireStaff(
  auth: JwtPayload,
  tenantId: string,
  tenantSlug: string,
  permission: AdminPermission = 'staff:write',
  message = 'You must be logged in as shop staff admin.',
): void {
  requireMerchantPermission(auth, tenantId, tenantSlug, permission);
}
