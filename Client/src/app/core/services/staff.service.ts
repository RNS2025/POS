import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CreateStaffRequest, StaffSummary, UpdateStaffRequest } from '@shared/staff';
import type { PaginatedResponse } from '@shared/platform';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, page = 1, limit = 20) {
    return this.http.get<PaginatedResponse<StaffSummary>>(
      `/api/v1/tenants/${tenantSlug}/staff`,
      { params: { page, limit } },
    );
  }

  create(tenantSlug: string, body: CreateStaffRequest) {
    return this.http.post<StaffSummary>(`/api/v1/tenants/${tenantSlug}/staff`, body);
  }

  update(tenantSlug: string, staffId: string, body: UpdateStaffRequest) {
    return this.http.patch<StaffSummary>(`/api/v1/tenants/${tenantSlug}/staff/${staffId}`, body);
  }
}
