export type UserRole = 'admin' | 'platform_admin';

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
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
