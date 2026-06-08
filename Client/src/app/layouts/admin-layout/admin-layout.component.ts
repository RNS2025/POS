import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { hasPermission } from '@shared/permissions';
import type { AdminPermission } from '@shared/permissions';
import { LogoutLink } from '../../core/components/logout-link';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoutLink],
  template: `
    <div class="shell shell-admin" data-shell="admin">
      <header class="wf-topbar">
        <div class="wf-brand-block">
          <span class="brand">Shop admin</span>
          <span class="sub">{{ tenantSlug }} · {{ roleLabel }}</span>
        </div>
        <div class="actions">
          <app-logout-link />
        </div>
      </header>
      <div class="wf-body">
        <nav class="wf-sidebar" aria-label="Admin navigation">
          @if (can('catalog:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'products']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Products
            </a>
          }
          @if (can('categories:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'categories']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Categories
            </a>
          }
          @if (can('kasser:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'kasser']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Kasser
            </a>
          }
          @if (can('staff:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'staff']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Staff
            </a>
          }
          @if (can('orders:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'orders']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Orders
            </a>
          }
          @if (can('setup:read')) {
            <a [routerLink]="['/', tenantSlug, 'admin', 'setup']" routerLinkActive="active">Setup</a>
          }
          @if (can('users:read')) {
            <a
              [routerLink]="['/', tenantSlug, 'admin', 'users']"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              Users
            </a>
          }
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
  private readonly session = inject(SessionService);

  protected tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
  protected roleLabel = this.session.user()?.role ?? '';

  protected can(permission: AdminPermission): boolean {
    const role = this.session.user()?.role ?? '';
    return hasPermission(role, permission);
  }
}
