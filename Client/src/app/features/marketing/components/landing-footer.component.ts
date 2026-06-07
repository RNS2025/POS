import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing-footer',
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="relative border-t border-white/5">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div class="flex items-start gap-4">
            <img src="/brand/logo.png" alt="RNS APPS" width="36" height="36" class="h-9 w-9 opacity-90" />
            <div>
              <p class="font-semibold text-ink">RNS APPS</p>
              <p class="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                {{ 'landing.footer.tagline' | translate }}
              </p>
            </div>
          </div>

          <div class="flex gap-12 text-sm">
            <div class="flex flex-col gap-3">
              <a routerLink="/register" class="text-ink-muted transition hover:text-accent">
                {{ 'landing.footer.register' | translate }}
              </a>
              <a routerLink="/login" class="text-ink-muted transition hover:text-accent">
                {{ 'landing.footer.login' | translate }}
              </a>
            </div>
            <a href="mailto:contact@rnsapps.dk" class="text-ink-muted transition hover:text-accent">
              {{ 'landing.footer.contact' | translate }}
            </a>
          </div>
        </div>

        <p class="mt-12 text-xs text-ink-muted/60">
          &copy; {{ year }} RNS APPS. {{ 'landing.footer.rights' | translate }}
        </p>
      </div>
    </footer>
  `,
})
export class LandingFooterComponent {
  protected readonly year = new Date().getFullYear();
}
