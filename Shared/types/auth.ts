export type MerchantAdminRole = 'owner' | 'manager' | 'viewer';

export type UserRole = MerchantAdminRole | 'platform_admin' | 'staff';

export interface RegisterRequest {
  shopName: string;
  slug: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
