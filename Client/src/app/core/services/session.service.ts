import { Injectable, signal } from '@angular/core';
import type { AuthUser } from '@shared/auth';

const TOKEN_KEY = 'pos_auth_token';
const USER_KEY = 'pos_auth_user';

function normalizeUser(raw: AuthUser): AuthUser {
  return {
    ...raw,
    mustChangePassword: raw.mustChangePassword ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly token = signal<string | null>(this.readToken());
  readonly user = signal<AuthUser | null>(this.readUser());

  setSession(token: string, user: AuthUser): void {
    const normalized = normalizeUser(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    this.token.set(token);
    this.user.set(normalized);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  isLoggedIn(): boolean {
    return this.token() !== null;
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return normalizeUser(JSON.parse(raw) as AuthUser);
    } catch {
      return null;
    }
  }
}
