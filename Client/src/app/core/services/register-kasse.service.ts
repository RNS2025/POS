import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  KasseCatalogResponse,
  KasseOrderStatusResponse,
  KassePinRequest,
  KassePinResponse,
  KasseQrRequest,
  KasseQrResponse,
  KasseReceiptResponse,
  KasseSaleRequest,
  KasseSaleResponse,
} from '@shared/kasse-register';

@Injectable({ providedIn: 'root' })
export class RegisterKasseService {
  private readonly http = inject(HttpClient);

  loginPin(tenantSlug: string, kasseSlug: string, body: KassePinRequest) {
    return this.http.post<KassePinResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/pin`,
      body,
    );
  }

  getCatalog(tenantSlug: string, kasseSlug: string) {
    return this.http.get<KasseCatalogResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/catalog`,
    );
  }

  createSale(tenantSlug: string, kasseSlug: string, body: KasseSaleRequest) {
    return this.http.post<KasseSaleResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/sales`,
      body,
    );
  }

  createQrPayment(tenantSlug: string, kasseSlug: string, body: KasseQrRequest) {
    return this.http.post<KasseQrResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/pay/qr`,
      body,
    );
  }

  getOrderStatus(tenantSlug: string, kasseSlug: string, orderId: string) {
    return this.http.get<KasseOrderStatusResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/orders/${orderId}`,
    );
  }

  getReceipt(tenantSlug: string, kasseSlug: string, orderId: string) {
    return this.http.get<KasseReceiptResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/${kasseSlug}/receipt/${orderId}`,
    );
  }
}
