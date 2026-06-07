import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../../../core/components/language-switcher.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing-header',
  imports: [RouterLink, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <header class="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <div
        class="landing-glass-strong mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 md:px-6"
      >
        <a routerLink="/" class="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90">
          <img src="/brand/logo.png" alt="RNS APPS" width="40" height="40" class="h-10 w-10" />
          <span class="hidden text-sm font-semibold tracking-wide text-ink sm:inline">RNS APPS</span>
        </a>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <a href="#features" class="rounded-xl px-4 py-2 text-sm text-ink-muted transition hover:bg-white/5 hover:text-ink">
            {{ 'landing.nav.features' | translate }}
          </a>
          <a href="#how-it-works" class="rounded-xl px-4 py-2 text-sm text-ink-muted transition hover:bg-white/5 hover:text-ink">
            {{ 'landing.nav.howItWorks' | translate }}
          </a>
          <a href="#pricing" class="rounded-xl px-4 py-2 text-sm text-ink-muted transition hover:bg-white/5 hover:text-ink">
            {{ 'landing.nav.pricing' | translate }}
          </a>
        </nav>

        <div class="flex items-center gap-2 md:gap-3">
          <app-language-switcher />
          <a routerLink="/login" class="hidden text-sm text-ink-muted transition hover:text-ink md:inline">
            {{ 'landing.nav.login' | translate }}
          </a>
          <a
            routerLink="/register"
            class="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
          >
            {{ 'landing.nav.startShop' | translate }}
          </a>
        </div>
      </div>
    </header>
  `,
})
export class LandingHeaderComponent {}
