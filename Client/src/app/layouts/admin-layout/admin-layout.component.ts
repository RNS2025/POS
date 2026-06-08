import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoutLink } from '../../core/components/logout-link';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoutLink],
  template: `
    <div class="shell shell-admin" data-shell="admin">
      <header class="wf-topbar">
        <div class="wf-brand-block">
          <span class="brand">Shop admin</span>
          <span class="sub">{{ tenantSlug }}</span>
        </div>
        <div class="actions">
          <app-logout-link />
        </div>
      </header>
      <div class="wf-body">
        <nav class="wf-sidebar" aria-label="Admin navigation">
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'products']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Products
          </a>
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'categories']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Categories
          </a>
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'kasser']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Kasser
          </a>
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'staff']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Staff
          </a>
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'orders']"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Orders
          </a>
          <a
            [routerLink]="['/', tenantSlug, 'admin', 'setup']"
            routerLinkActive="active"
          >
            Setup
          </a>
        </nav>
        <main class="wf-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
}
