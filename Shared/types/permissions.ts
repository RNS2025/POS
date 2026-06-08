/** Merchant admin permission matrix — also mirrored in Server/src/domain/merchant-permissions.ts */
import type { MerchantAdminRole } from './auth.js';

export type AdminPermission =
  | 'catalog:read'
  | 'catalog:write'
  | 'categories:read'
  | 'categories:write'
  | 'kasser:read'
  | 'kasser:write'
  | 'staff:read'
  | 'staff:write'
  | 'orders:read'
  | 'orders:write'
  | 'setup:read'
  | 'setup:write'
  | 'users:read'
  | 'users:write';

export const MERCHANT_ROLE_PERMISSIONS: Record<MerchantAdminRole, readonly AdminPermission[]> = {
  owner: [
    'catalog:read',
    'catalog:write',
    'categories:read',
    'categories:write',
    'kasser:read',
    'kasser:write',
    'staff:read',
    'staff:write',
    'orders:read',
    'orders:write',
    'setup:read',
    'setup:write',
    'users:read',
    'users:write',
  ],
  manager: [
    'catalog:read',
    'catalog:write',
    'categories:read',
    'categories:write',
    'kasser:read',
    'kasser:write',
    'staff:read',
    'staff:write',
    'orders:read',
    'setup:read',
  ],
  viewer: [
    'catalog:read',
    'categories:read',
    'kasser:read',
    'staff:read',
    'orders:read',
  ],
};

export function isMerchantAdminRole(role: string): role is MerchantAdminRole {
  return role === 'owner' || role === 'manager' || role === 'viewer';
}

export function hasPermission(role: string, permission: AdminPermission): boolean {
  if (!isMerchantAdminRole(role)) {
    return false;
  }
  return MERCHANT_ROLE_PERMISSIONS[role].includes(permission);
}
