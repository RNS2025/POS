import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CategoryListResponse,
  CategorySummary,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@shared/catalog';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, page = 1, limit = 50) {
    return this.http.get<CategoryListResponse>(`/api/v1/tenants/${tenantSlug}/categories`, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  get(tenantSlug: string, categoryId: string) {
    return this.http.get<CategorySummary>(`/api/v1/tenants/${tenantSlug}/categories/${categoryId}`);
  }

  create(tenantSlug: string, body: CreateCategoryRequest) {
    return this.http.post<CategorySummary>(`/api/v1/tenants/${tenantSlug}/categories`, body);
  }

  update(tenantSlug: string, categoryId: string, body: UpdateCategoryRequest) {
    return this.http.patch<CategorySummary>(
      `/api/v1/tenants/${tenantSlug}/categories/${categoryId}`,
      body,
    );
  }

  delete(tenantSlug: string, categoryId: string) {
    return this.http.delete<{ deleted: boolean }>(
      `/api/v1/tenants/${tenantSlug}/categories/${categoryId}`,
    );
  }
}
