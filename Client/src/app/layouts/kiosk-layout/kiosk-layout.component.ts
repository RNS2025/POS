import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-kiosk-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="shell shell-kiosk" data-shell="kiosk">
      <header class="wf-topbar">
        <div class="wf-brand-block">
          <span class="brand">{{ shopName || 'Kiosk' }}</span>
          <span class="sub">{{ tenantSlug }}/kiosk/{{ kasseSlug }}</span>
        </div>
      </header>
      <main class="wf-content wf-kiosk-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class KioskLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
  protected kasseSlug = this.route.snapshot.paramMap.get('kasseSlug') ?? '';
  protected shopName = '';
}
