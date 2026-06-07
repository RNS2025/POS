import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LogoutLink } from '../../../core/components/logout-link';
import { KasseService } from '../../../core/services/kasse.service';
import { OrdersService } from '../../../core/services/orders.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-kasse-page',
  imports: [FormsModule, RouterLink, LogoutLink, CurrencyPipe],
  templateUrl: './kasse.page.html',
})
export class KassePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly kasse = inject(KasseService);
  private readonly ordersApi = inject(OrdersService);

  protected tenantSlug = '';
  protected amountDkk = 100;
  protected description = '';
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly loading = signal(false);
  protected readonly lastAmountOre = signal<number | null>(null);
  protected readonly lastOrderId = signal<string | null>(null);
  protected readonly pendingOrderId = signal<string | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  protected charge(): void {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);
    this.lastOrderId.set(null);
    this.stopPolling();

    const amountOre = Math.round(this.amountDkk * 100);
    this.kasse
      .createSale(this.tenantSlug, {
        amountOre,
        description: this.description || undefined,
      })
      .subscribe({
        next: (res) => {
          this.lastAmountOre.set(res.amountOre);
          this.lastOrderId.set(res.orderId);
          this.success.set('Payment approved on terminal.');
          this.loading.set(false);
        },
        error: (err) => {
          const msg = apiErrorMessage(err, 'Payment failed. Check the terminal and try again.');
          this.error.set(msg);
          this.loading.set(false);
          const body = err.error as { orderId?: string } | undefined;
          if (body?.orderId) {
            this.lastOrderId.set(body.orderId);
          }
        },
      });
  }

  protected retryLast(): void {
    const orderId = this.lastOrderId();
    if (!orderId) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.ordersApi.retry(this.tenantSlug, orderId).subscribe({
      next: () => {
        this.success.set('Payment retried successfully.');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Retry failed.'));
        this.loading.set(false);
      },
    });
  }

  protected abortPending(): void {
    const orderId = this.pendingOrderId();
    if (!orderId) {
      return;
    }
    this.ordersApi.abortSale(this.tenantSlug, orderId).subscribe({
      next: () => {
        this.success.set('Terminal payment cancelled.');
        this.pendingOrderId.set(null);
        this.stopPolling();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not abort payment.'));
      },
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
