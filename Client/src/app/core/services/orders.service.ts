import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AbortSaleResponse,
  OrderDetailResponse,
  OrderListQuery,
  OrderListResponse,
  RefundOrderRequest,
  RefundOrderResponse,
  RetryOrderResponse,
  SyncOrderStatusResponse,
  VoidOrderResponse,
} from '@shared/orders';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  list(tenantSlug: string, query: OrderListQuery = {}) {
    const params: Record<string, string> = {};
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);
    if (query.status) params['status'] = query.status;
    if (query.channel) params['channel'] = query.channel;
    if (query.kasseId) params['kasseId'] = query.kasseId;
    if (query.staffUserId) params['staffUserId'] = query.staffUserId;
    if (query.paymentMethod) params['paymentMethod'] = query.paymentMethod;
    if (query.q) params['q'] = query.q;
    return this.http.get<OrderListResponse>(`/api/v1/tenants/${tenantSlug}/orders`, { params });
  }

  getDetail(tenantSlug: string, orderId: string) {
    return this.http.get<OrderDetailResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/detail`,
    );
  }

  retry(tenantSlug: string, orderId: string) {
    return this.http.post<RetryOrderResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/retry`,
      {},
    );
  }

  refund(tenantSlug: string, orderId: string, body: RefundOrderRequest, idempotencyKey?: string) {
    const headers = idempotencyKey
      ? new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
      : undefined;
    return this.http.post<RefundOrderResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/refund`,
      body,
      { headers },
    );
  }

  voidSale(tenantSlug: string, orderId: string) {
    return this.http.post<VoidOrderResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/void`,
      {},
    );
  }

  abortSale(tenantSlug: string, orderId: string) {
    return this.http.post<AbortSaleResponse>(
      `/api/v1/tenants/${tenantSlug}/kasse/sales/${orderId}/abort`,
      {},
    );
  }

  syncStatus(tenantSlug: string, orderId: string) {
    return this.http.post<SyncOrderStatusResponse>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/sync-status`,
      {},
    );
  }

  markCancelled(tenantSlug: string, orderId: string) {
    return this.http.post<{ orderId: string; status: string }>(
      `/api/v1/tenants/${tenantSlug}/orders/${orderId}/mark-cancelled`,
      {},
    );
  }
}
