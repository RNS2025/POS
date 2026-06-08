import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-kiosk-success-page',
  imports: [RouterLink],
  template: `
    <div class="wf-success">
      <div class="wf-icon-ok">✓</div>
      <h2>Thank you!</h2>
      <p>Payment received.</p>
      <a class="wf-btn primary" [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug]">New order</a>
    </div>
  `,
})
export class KioskSuccessPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = '';
  protected kasseSlug = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
  }
}
