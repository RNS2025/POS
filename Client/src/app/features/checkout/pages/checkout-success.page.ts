import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { OrderStatusResponse } from '@shared/checkout';
import { CheckoutService } from '../../../core/services/checkout.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-checkout-success-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './checkout-success.page.html',
})
export class CheckoutSuccessPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly checkout = inject(CheckoutService);

  protected tenantSlug = '';
  protected orderId = '';
  protected readonly order = signal<OrderStatusResponse | null>(null);
  protected readonly error = signal('');

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollAttempts = 0;
  private readonly maxPollAttempts = 10;
  private readonly pollIntervalMs = 3000;

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    if (this.orderId) {
      this.syncThenPoll();
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }

  private syncThenPoll(): void {
    this.checkout.syncPayment(this.tenantSlug, this.orderId).subscribe({
      next: () => this.loadStatus(),
      error: () => this.loadStatus(),
    });
  }

  private loadStatus(): void {
    this.checkout.getOrderStatus(this.tenantSlug, this.orderId).subscribe({
      next: (res) => {
        this.order.set(res);
        this.schedulePollIfPending(res.status);
      },
      error: (err) => this.error.set(apiErrorMessage(err, 'Could not load order status.')),
    });
  }

  private schedulePollIfPending(status: string): void {
    if (status !== 'pending' && status !== 'authorized') {
      return;
    }
    if (this.pollAttempts >= this.maxPollAttempts) {
      return;
    }
    this.pollAttempts += 1;
    this.pollTimer = setTimeout(() => this.loadStatus(), this.pollIntervalMs);
  }
}
