import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreateKasseRequest,
  KasseListResponse,
  KasseSummary,
  SetKasseProductsRequest,
  UpdateKasseRequest,
} from '@shared/catalog';

@Injectable({ providedIn: 'root' })
export class KasserService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, page = 1, limit = 20) {
    return this.http.get<KasseListResponse>(`/api/v1/tenants/${tenantSlug}/kasser`, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  get(tenantSlug: string, kasseId: string) {
    return this.http.get<KasseSummary>(`/api/v1/tenants/${tenantSlug}/kasser/${kasseId}`);
  }

  create(tenantSlug: string, body: CreateKasseRequest) {
    return this.http.post<KasseSummary>(`/api/v1/tenants/${tenantSlug}/kasser`, body);
  }

  update(tenantSlug: string, kasseId: string, body: UpdateKasseRequest) {
    return this.http.patch<KasseSummary>(`/api/v1/tenants/${tenantSlug}/kasser/${kasseId}`, body);
  }

  setProducts(tenantSlug: string, kasseId: string, body: SetKasseProductsRequest) {
    return this.http.put<{ productIds: string[] }>(
      `/api/v1/tenants/${tenantSlug}/kasser/${kasseId}/products`,
      body,
    );
  }
}
