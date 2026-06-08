import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KioskService } from '../../../core/services/kiosk.service';
import { QrCodeComponent } from '../../../shared/components/qr-code/qr-code.component';

@Component({
  selector: 'app-kiosk-qr-page',
  imports: [RouterLink, CurrencyPipe, QrCodeComponent],
  template: `
    <div class="page-title">
      <h1>Scan to pay</h1>
      @if (amountOre() !== null) {
        <p class="wf-amount">{{ amountOre()! / 100 | currency: currency() : 'symbol' : '1.0-0' }}</p>
      }
      <p class="wf-hint">Scan the QR code with your phone to pay.</p>
    </div>
    @if (paymentUrl()) {
      <div class="wf-qr-box">
        <qr-code [value]="paymentUrl()" [size]="240" />
      </div>
      <p><a class="wf-btn primary" [href]="paymentUrl()" target="_blank" rel="noopener">Open payment page</a></p>
      <p class="wf-hint">{{ statusMessage() }}</p>
    }
    <p>
      <a
        class="wf-btn ghost"
        [routerLink]="['/', tenantSlug, 'kiosk', kasseSlug, 'checkout', 'cancel']"
        [queryParams]="{ orderId: orderId }"
        >Cancel</a
      >
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
  protected readonly amountOre = signal<number | null>(null);
  protected readonly currency = signal('DKK');
  protected readonly statusMessage = signal('Waiting for payment…');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    this.paymentUrl.set(this.route.snapshot.queryParamMap.get('paymentUrl') ?? '');
    if (this.orderId) {
      this.loadOrderStatus();
      this.pollTimer = setInterval(() => this.poll(), 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  private loadOrderStatus(): void {
    this.kioskApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
      next: (res) => this.applyOrderStatus(res),
    });
  }

  private poll(): void {
    this.kioskApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
      next: (res) => this.applyOrderStatus(res),
    });
  }

  private applyOrderStatus(res: {
    status: string;
    paymentStatus: string | null;
    amountOre: number;
    currency: string;
    paymentUrl: string | null;
  }): void {
    this.amountOre.set(res.amountOre);
    this.currency.set(res.currency);
    if (!this.paymentUrl() && res.paymentUrl) {
      this.paymentUrl.set(res.paymentUrl);
    }
    if (res.status === 'captured' || res.paymentStatus === 'captured') {
      void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'checkout', 'success'], {
        queryParams: { orderId: this.orderId },
      });
    }
  }
}
