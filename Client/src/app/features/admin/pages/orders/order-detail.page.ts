import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CopyFieldComponent } from '../../../../shared/components/copy-field/copy-field.component';
import { PosButtonComponent } from '../../../../shared/components/pos-button/pos-button.component';
import { hasPermission } from '@shared/permissions';
import { OrdersService } from '../../../../core/services/orders.service';
import { SessionService } from '../../../../core/services/session.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { displayText } from '../../../../core/utils/display-value';
import type { OrderDetailResponse, PaymentActionType, RetryOrderResponse, SyncOrderStatusResponse } from '@shared/orders';

@Component({
  selector: 'app-order-detail-page',
  imports: [
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    PosButtonComponent,
    ConfirmDialogComponent,
    CopyFieldComponent,
  ],
  templateUrl: './order-detail.page.html',
})
export class OrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersService);
  private readonly session = inject(SessionService);

  protected tenantSlug = '';
  protected orderId = '';
  protected readonly order = signal<OrderDetailResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly actionLoading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly paymentUrl = signal('');

  protected refundAmountDkk = 0;
  protected readonly refundDialogOpen = signal(false);
  protected readonly voidDialogOpen = signal(false);
  protected readonly abortDialogOpen = signal(false);

  ngOnInit(): void {
    this.tenantSlug =
      this.route.parent?.snapshot.paramMap.get('tenantSlug') ??
      this.route.snapshot.paramMap.get('tenantSlug') ??
      '';
    this.orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.ordersApi.getDetail(this.tenantSlug, this.orderId).subscribe({
      next: (res) => {
        this.order.set(res);
        this.refundAmountDkk = res.refundableAmountOre / 100;
        if (res.paymentUrl) {
          this.paymentUrl.set(res.paymentUrl);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load order.'));
        this.loading.set(false);
      },
    });
  }

  protected showPaymentLink(): boolean {
    const o = this.order();
    if (!o || o.channel !== 'online') {
      return false;
    }
    return Boolean(this.paymentUrl() || o.paymentUrl);
  }

  protected displayPaymentUrl(): string {
    return this.paymentUrl() || this.order()?.paymentUrl || '';
  }

  protected hasAction(action: PaymentActionType): boolean {
    if (!this.canWriteOrders()) {
      return false;
    }
    return this.order()?.allowedActions.includes(action) ?? false;
  }

  protected canWriteOrders(): boolean {
    const role = this.session.user()?.role ?? '';
    return hasPermission(role, 'orders:write');
  }

  protected retry(): void {
    this.runAction(
      () => this.ordersApi.retry(this.tenantSlug, this.orderId),
      (res: RetryOrderResponse) => {
        if (res.paymentUrl) {
          this.paymentUrl.set(res.paymentUrl);
          this.success.set('New payment link created. Share it with the customer or open it below.');
        } else {
          this.success.set('Payment retried successfully.');
        }
        this.load();
      },
    );
  }

  protected refund(): void {
    const amountOre = Math.round(this.refundAmountDkk * 100);
    const key = `refund-${this.orderId}-${amountOre}-${Date.now()}`;
    this.runAction(
      () => this.ordersApi.refund(this.tenantSlug, this.orderId, { amountOre }, key),
      () => {
        this.success.set('Refund submitted.');
        this.refundDialogOpen.set(false);
        this.load();
      },
    );
  }

  protected voidSale(): void {
    this.voidDialogOpen.set(false);
    this.runAction(
      () => this.ordersApi.voidSale(this.tenantSlug, this.orderId),
      () => {
        this.success.set('Sale voided on terminal.');
        this.load();
      },
    );
  }

  protected abortSale(): void {
    this.abortDialogOpen.set(false);
    this.runAction(
      () => this.ordersApi.abortSale(this.tenantSlug, this.orderId),
      () => {
        this.success.set('Terminal payment aborted.');
        this.load();
      },
    );
  }

  protected canSyncStatus(): boolean {
    if (!this.canWriteOrders()) {
      return false;
    }
    const o = this.order();
    if (!o || o.channel !== 'online') {
      return false;
    }
    return ['pending', 'authorized', 'failed', 'cancelled'].includes(o.status);
  }

  protected syncStatus(): void {
    this.runAction(
      () => this.ordersApi.syncStatus(this.tenantSlug, this.orderId),
      (res) => {
        this.success.set(
          res.synced
            ? `Status updated to ${res.status}.`
            : `Already up to date (${res.status}).`,
        );
        this.load();
      },
    );
  }

  protected readonly displayText = displayText;

  protected kasseLabel(o: OrderDetailResponse): string {
    if (!o.kasseName?.trim()) {
      return 'Not set';
    }
    return o.kasseSlug ? `${o.kasseName} (${o.kasseSlug})` : o.kasseName;
  }

  private runAction<T>(call: () => import('rxjs').Observable<T>, onSuccess: (res: T) => void): void {
    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');
    call().subscribe({
      next: (res) => {
        onSuccess(res);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Action failed.'));
        this.actionLoading.set(false);
        this.load();
      },
    });
  }
}
