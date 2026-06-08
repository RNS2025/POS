import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@shared/auth';
import type { ChangePasswordRequest } from '@shared/admin-users';
import type { AcceptInviteRequest, InvitePreview } from '@shared/invite';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  register(body: RegisterRequest) {
    return this.http.post<AuthResponse>('/api/v1/auth/register', body);
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>('/api/v1/auth/login', body);
  }

  getInvite(token: string) {
    return this.http.get<InvitePreview>(`/api/v1/invites/${token}`);
  }

  acceptInvite(token: string, body: AcceptInviteRequest) {
    return this.http.post<AuthResponse>(`/api/v1/invites/${token}/accept`, body);
  }

  changePassword(body: ChangePasswordRequest) {
    return this.http.post<AuthResponse>('/api/v1/auth/change-password', body);
  }
}
