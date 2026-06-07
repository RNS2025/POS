import { Injectable, signal } from '@angular/core';
import { da } from './locales/da';
import { en } from './locales/en';
import type { Locale } from './translation.types';

const STORAGE_KEY = 'pos.locale';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly dictionaries = { en, da } as const;

  readonly locale = signal<Locale>(this.readStoredLocale());

  t(key: string): string {
    const parts = key.split('.');
    let value: unknown = this.dictionaries[this.locale()];

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
  }

  private readStoredLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'da' ? 'da' : 'en';
  }
}
