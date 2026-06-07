import { Component, inject } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';
import type { Locale } from '../i18n/translation.types';

@Component({
  selector: 'app-language-switcher',
  template: `
    <div class="flex gap-0.5 rounded-xl border border-white/10 bg-black/30 p-0.5">
      @for (option of options; track option.code) {
        <button
          type="button"
          (click)="setLocale(option.code)"
          [class.bg-accent]="i18n.locale() === option.code"
          [class.text-white]="i18n.locale() === option.code"
          [class.text-ink-muted]="i18n.locale() !== option.code"
          class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);

  protected readonly options: { code: Locale; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'da', label: 'DA' },
  ];

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }
}
