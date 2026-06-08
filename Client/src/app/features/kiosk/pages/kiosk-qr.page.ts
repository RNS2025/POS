import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KioskService } from '../../../core/services/kiosk.service';

@Component({
  selector: 'app-kiosk-qr-page',
  imports: [RouterLink],
  template: `
    <div class="page-title">
      <h1>Scan to pay</h1>
      <p>Open the payment link on your phone or scan the QR code.</p>
    </div>
    @if (paymentUrl()) {
      <div class="wf-qr-box"><span>QR</span></div>
      <p><a class="wf-btn primary" [href]="paymentUrl()" target="_blank" rel="noopener">Open payment page</a></p>
      <p class="wf-hint">{{ statusMessage() }}</p>
    }
    <p>
      <a class="wf-btn ghost" [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug, 'checkout', 'cancel']" [queryParams]="{ orderId: orderId }">Cancel</a>
    </p>
  `,
})
export class KioskQrPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly kioskApi = inject(KioskService);
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
    this.kioskApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
      next: (res) => {
        if (res.status === 'captured' || res.paymentStatus === 'captured') {
          void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'checkout', 'success'], {
            queryParams: { orderId: this.orderId },
          });
        }
      },
    });
  }
}
