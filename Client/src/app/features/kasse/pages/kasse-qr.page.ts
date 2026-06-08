import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegisterKasseService } from '../../../core/services/register-kasse.service';
import { QrCodeComponent } from '../../../shared/components/qr-code/qr-code.component';

@Component({
  selector: 'app-kasse-qr-page',
  imports: [RouterLink, CurrencyPipe, QrCodeComponent],
  template: `
    <header class="wf-topbar">
      <a class="wf-btn ghost" [routerLink]="['/', tenantSlug, 'kasse', kasseSlug]">← Cancel</a>
      <span class="brand">Scan to pay</span>
    </header>
    <div class="wf-content wf-success">
      @if (amountOre() !== null) {
        <h2>{{ amountOre()! / 100 | currency: currency() : 'symbol' : '1.0-0' }}</h2>
      }
      <p class="wf-hint">Scan the QR code with your phone to pay.</p>
      @if (paymentUrl()) {
        <div class="wf-qr-box">
          <qr-code [value]="paymentUrl()" [size]="240" />
        </div>
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
    this.registerApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
      next: (res) => this.applyOrderStatus(res),
    });
  }

  private poll(): void {
    this.registerApi.getOrderStatus(this.tenantSlug, this.kasseSlug, this.orderId).subscribe({
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
      void this.router.navigate(['/', this.tenantSlug, 'kasse', this.kasseSlug, 'receipt'], {
        queryParams: { orderId: this.orderId },
      });
    }
  }
}
