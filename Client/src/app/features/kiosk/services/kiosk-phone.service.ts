import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KioskPhoneService {
  private readonly phone = signal('');
  private storageKey = '';

  readonly value = this.phone.asReadonly();

  bind(tenantSlug: string, kasseSlug: string): void {
    this.storageKey = `kiosk-phone:${tenantSlug}:${kasseSlug}`;
    const saved = sessionStorage.getItem(this.storageKey) ?? '';
    this.phone.set(saved);
  }

  append(digit: string): void {
    if (this.phone().length >= 15) {
      return;
    }
    this.phone.update((v) => v + digit);
  }

  backspace(): void {
    this.phone.update((v) => v.slice(0, -1));
  }

  clear(): void {
    this.phone.set('');
  }

  save(): void {
    if (this.storageKey) {
      sessionStorage.setItem(this.storageKey, this.phone());
    }
  }

  current(): string {
    return this.phone();
  }
}
