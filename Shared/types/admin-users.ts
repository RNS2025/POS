import type { MerchantAdminRole } from './auth.js';

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  role: MerchantAdminRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateAdminUserRequest {
  email: string;
  displayName: string;
  role: MerchantAdminRole;
  temporaryPassword: string;
}

export interface UpdateAdminUserRequest {
  displayName?: string;
  role?: MerchantAdminRole;
  isActive?: boolean;
}

export interface ResetAdminUserPasswordRequest {
  temporaryPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
