import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AdminUserSummary,
  ChangePasswordRequest,
  CreateAdminUserRequest,
  ResetAdminUserPasswordRequest,
  UpdateAdminUserRequest,
} from '@shared/admin-users';
import type { PaginatedResponse } from '@shared/platform';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, page = 1, limit = 20) {
    return this.http.get<PaginatedResponse<AdminUserSummary>>(
      `/api/v1/tenants/${tenantSlug}/admin/users`,
      { params: { page, limit } },
    );
  }

  create(tenantSlug: string, body: CreateAdminUserRequest) {
    return this.http.post<AdminUserSummary>(`/api/v1/tenants/${tenantSlug}/admin/users`, body);
  }

  update(tenantSlug: string, userId: string, body: UpdateAdminUserRequest) {
    return this.http.patch<AdminUserSummary>(
      `/api/v1/tenants/${tenantSlug}/admin/users/${userId}`,
      body,
    );
  }

  resetPassword(tenantSlug: string, userId: string, body: ResetAdminUserPasswordRequest) {
    return this.http.post<AdminUserSummary>(
      `/api/v1/tenants/${tenantSlug}/admin/users/${userId}/reset-password`,
      body,
    );
  }
}
