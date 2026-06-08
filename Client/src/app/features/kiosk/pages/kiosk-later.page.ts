import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-kiosk-later-page',
  imports: [RouterLink],
  template: `
    <div class="wf-success">
      <div class="wf-icon-ok">✓</div>
      <h2>Order registered</h2>
      <p>Pay at the counter when you are ready.</p>
      <p class="wf-hint">Order ref: {{ orderId }}</p>
      <a class="wf-btn primary" [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug]">Back to menu</a>
    </div>
  `,
})
export class KioskLaterPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected tenantSlug = '';
  protected kasseSlug = '';
  protected orderId = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
  }
}
