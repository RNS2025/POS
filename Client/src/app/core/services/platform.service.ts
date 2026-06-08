import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreatePlatformMerchantRequest,
  CreatePlatformMerchantResponse,
  CreatePlatformNoteRequest,
  PaginatedResponse,
  SavePlatformQuickpayRequest,
  PlatformDashboardStats,
  PlatformMerchantDetail,
  PlatformMerchantListQuery,
  PlatformMerchantNote,
  PlatformOrderSummary,
  PlatformMerchantSummary,
} from '@shared/platform';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly http = inject(HttpClient);

  getDashboardStats() {
    return this.http.get<PlatformDashboardStats>('/api/v1/platform/dashboard/stats');
  }

  exportMerchantsCsv(query: PlatformMerchantListQuery = {}) {
    let params = new HttpParams();
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    return this.http.get('/api/v1/platform/merchants/export', {
      params,
      responseType: 'blob',
    });
  }

  listMerchantOrders(tenantId: string, page = 1, limit = 20) {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<PaginatedResponse<PlatformOrderSummary>>(
      `/api/v1/platform/merchants/${tenantId}/orders`,
      { params },
    );
  }

  listMerchants(query: PlatformMerchantListQuery = {}) {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<PaginatedResponse<PlatformMerchantSummary>>('/api/v1/platform/merchants', {
      params,
    });
  }

  createMerchant(body: CreatePlatformMerchantRequest) {
    return this.http.post<CreatePlatformMerchantResponse>('/api/v1/platform/merchants', body);
  }

  getMerchant(tenantId: string) {
    return this.http.get<PlatformMerchantDetail>(`/api/v1/platform/merchants/${tenantId}`);
  }

  pingQuickpay(tenantId: string) {
    return this.http.post<PlatformMerchantDetail>(
      `/api/v1/platform/merchants/${tenantId}/ping-quickpay`,
      {},
    );
  }

  saveMerchantQuickpay(tenantId: string, body: SavePlatformQuickpayRequest) {
    return this.http.put<PlatformMerchantDetail>(
      `/api/v1/platform/merchants/${tenantId}/quickpay`,
      body,
    );
  }

  addNote(tenantId: string, body: CreatePlatformNoteRequest) {
    return this.http.post<PlatformMerchantNote>(`/api/v1/platform/merchants/${tenantId}/notes`, body);
  }
}
