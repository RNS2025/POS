import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CreateKasseSaleRequest, KasseSaleResponse, KasseSaleStatusResponse } from '@shared/kasse';

@Injectable({ providedIn: 'root' })
export class KasseService {
  private readonly http = inject(HttpClient);

  createSale(tenantSlug: string, body: CreateKasseSaleRequest) {
    return this.http.post<KasseSaleResponse>(`/api/v1/tenants/${tenantSlug}/kasse/sales`, body);
  }

  getSale(tenantSlug: string, orderId: string) {
    return this.http.get<KasseSaleStatusResponse>(`/api/v1/tenants/${tenantSlug}/kasse/sales/${orderId}`);
  }
}
