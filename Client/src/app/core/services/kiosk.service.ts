import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  KioskCatalogResponse,
  KioskCheckoutRequest,
  KioskCheckoutResponse,
} from '@shared/kiosk';

@Injectable({ providedIn: 'root' })
export class KioskService {
  private readonly http = inject(HttpClient);

  getCatalog(tenantSlug: string, kasseSlug: string) {
    return this.http.get<KioskCatalogResponse>(
      `/api/v1/tenants/${tenantSlug}/kiosk/${kasseSlug}/catalog`,
    );
  }

  checkout(tenantSlug: string, kasseSlug: string, body: KioskCheckoutRequest) {
    return this.http.post<KioskCheckoutResponse>(
      `/api/v1/tenants/${tenantSlug}/kiosk/${kasseSlug}/checkout`,
      body,
    );
  }

  getOrderStatus(tenantSlug: string, kasseSlug: string, orderId: string) {
    return this.http.get<{
      orderId: string;
      status: string;
      paymentStatus: string | null;
      amountOre: number;
      currency: string;
    }>(`/api/v1/tenants/${tenantSlug}/kiosk/${kasseSlug}/orders/${orderId}`);
  }
}
