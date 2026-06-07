import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CreateCheckoutRequest, CreateCheckoutResponse, OrderStatusResponse, SyncPaymentResponse } from '@shared/checkout';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  createCheckout(tenantSlug: string, body: CreateCheckoutRequest) {
    return this.http.post<CreateCheckoutResponse>(`/api/v1/tenants/${tenantSlug}/checkout`, body);
  }

  getOrderStatus(tenantSlug: string, orderId: string) {
    return this.http.get<OrderStatusResponse>(`/api/v1/tenants/${tenantSlug}/orders/${orderId}`);
  }

  syncPayment(tenantSlug: string, orderId: string) {
    return this.http.post<SyncPaymentResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/sync-payment`,
      {},
    );
  }
}
