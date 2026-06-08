import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegisterKasseService } from '../../../core/services/register-kasse.service';

@Component({
  selector: 'app-kasse-qr-page',
  imports: [RouterLink],
  template: `
    <header class="wf-topbar">
      <a class="wf-btn ghost" [routerLink]="['/', tenantSlug, 'kasse', kasseSlug]">← Cancel</a>
      <span class="brand">Scan to pay</span>
    </header>
    <div class="wf-content wf-success">
      @if (paymentUrl()) {
        <div class="wf-qr-box"><span>QR</span></div>
        <p><a class="wf-btn kasse" [href]="paymentUrl()" target="_blank" rel="noopener">Open payment page</a></p>
        <p class="wf-hint">{{ statusMessage() }}</p>
      }
    </div>
  `,
})
export class KasseQrPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registerApi = inject(RegisterKasseService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  protected tenantSlug = '';
  protected kasseSlug = '';
  protected orderId = '';
  protected readonly paymentUrl = signal('');
  protected readonly statusMessage = signal('Waiting for payment…');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    this.paymentUrl.set(this.route.snapshot.queryParamMap.get('paymentUrl') ?? '');
    if (this.orderId) {
      this.pollTimer = setInterval(() => this.poll(), 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  private poll(): void {
    this.registerApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
      next: (res) => {
        if (res.status === 'captured' || res.paymentStatus === 'captured') {
          void this.router.navigate(['/', this.tenantSlug, 'kasse', this.kasseSlug, 'receipt'], {
            queryParams: { orderId: this.orderId },
          });
        }
      },
    });
  }
}
