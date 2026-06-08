import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-kiosk-cancel-page',
  imports: [RouterLink],
  template: `
    <div class="page-title">
      <h1>Payment cancelled</h1>
      <p>You can try again or return to the menu.</p>
    </div>
    <p>
      <a class="wf-btn primary" [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug, 'checkout']">Try again</a>
      <a class="wf-btn ghost" [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug]">Back to menu</a>
    </p>
  `,
})
export class KioskCancelPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = '';
  protected kasseSlug = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
  }
}
