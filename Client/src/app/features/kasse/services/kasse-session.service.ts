import { Injectable, signal } from '@angular/core';

export interface KasseSessionState {
  token: string;
  staffUserId: string;
  displayName: string | null;
  kasseId: string;
  kasseSlug: string;
  tenantSlug: string;
}

@Injectable({ providedIn: 'root' })
export class KasseSessionService {
  private readonly storageKey = 'pos-kasse-session';
  private readonly state = signal<KasseSessionState | null>(this.read());

  readonly session = this.state.asReadonly();

  token(): string | null {
    return this.state()?.token ?? null;
  }

  bind(tenantSlug: string, kasseSlug: string): void {
    const current = this.state();
    if (current && (current.tenantSlug !== tenantSlug || current.kasseSlug !== kasseSlug)) {
      this.clear();
    }
  }

  save(
    tenantSlug: string,
    kasseSlug: string,
    data: Pick<KasseSessionState, 'token' | 'staffUserId' | 'displayName' | 'kasseId'>,
  ): void {
    const next: KasseSessionState = { ...data, tenantSlug, kasseSlug };
    this.state.set(next);
    sessionStorage.setItem(this.storageKey, JSON.stringify(next));
  }

  clear(): void {
    this.state.set(null);
    sessionStorage.removeItem(this.storageKey);
  }

  isActive(tenantSlug: string, kasseSlug: string): boolean {
    const s = this.state();
    return Boolean(s && s.tenantSlug === tenantSlug && s.kasseSlug === kasseSlug && s.token);
  }

  private read(): KasseSessionState | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as KasseSessionState;
    } catch {
      return null;
    }
  }
}
