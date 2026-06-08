import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-kasse-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="shell shell-kasse" data-shell="kasse">
      <router-outlet />
    </div>
  `,
})
export class KasseLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
  protected kasseSlug = this.route.snapshot.paramMap.get('kasseSlug') ?? '';
}
