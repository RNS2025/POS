import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ProductListResponse, ProductSummary } from '@shared/catalog';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, page = 1, limit = 20) {
    return this.http.get<ProductListResponse>(`/api/v1/tenants/${tenantSlug}/products`, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  get(tenantSlug: string, productId: string) {
    return this.http.get<ProductSummary>(`/api/v1/tenants/${tenantSlug}/products/${productId}`);
  }

  create(tenantSlug: string, formData: FormData) {
    return this.http.post<ProductSummary>(`/api/v1/tenants/${tenantSlug}/products`, formData);
  }

  update(tenantSlug: string, productId: string, formData: FormData) {
    return this.http.patch<ProductSummary>(
      `/api/v1/tenants/${tenantSlug}/products/${productId}`,
      formData,
    );
  }
}
