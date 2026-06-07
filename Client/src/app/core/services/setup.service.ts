import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { SetupQuickpayRequest, SetupResponse, SetupVerifoneRequest } from '@shared/setup';

@Injectable({ providedIn: 'root' })
export class SetupService {
  private readonly http = inject(HttpClient);

  getSetup(tenantSlug: string) {
    return this.http.get<SetupResponse>(`/api/v1/tenants/${tenantSlug}/setup`);
  }

  saveQuickpay(tenantSlug: string, body: SetupQuickpayRequest) {
    return this.http.put<SetupResponse>(`/api/v1/tenants/${tenantSlug}/setup/quickpay`, body);
  }

  saveVerifone(tenantSlug: string, body: SetupVerifoneRequest) {
    return this.http.put<SetupResponse>(`/api/v1/tenants/${tenantSlug}/setup/verifone`, body);
  }
}
