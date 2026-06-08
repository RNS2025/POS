import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { KasseSummary } from '@shared/catalog';
import type { OrderListItem, OrderPaymentMethod, PaymentChannel } from '@shared/orders';
import type { OrderStatus } from '@shared/checkout';
import type { StaffSummary } from '@shared/staff';
import { KasserService } from '../../../../core/services/kasser.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { StaffService } from '../../../../core/services/staff.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { displayOptional } from '../../../../core/utils/display-value';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { PosButtonComponent } from '../../../../shared/components/pos-button/pos-button.component';

@Component({
  selector: 'app-orders-list-page',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, PosButtonComponent, PaginatorComponent],
  templateUrl: './orders-list.page.html',
})
export class OrdersListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersService);
  private readonly kasserApi = inject(KasserService);
  private readonly staffApi = inject(StaffService);

  protected tenantSlug = '';
  protected readonly items = signal<OrderListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly kasser = signal<KasseSummary[]>([]);
  protected readonly staff = signal<StaffSummary[]>([]);

  protected statusFilter = '';
  protected channelFilter = '';
  protected kasseFilter = '';
  protected staffFilter = '';
  protected paymentMethodFilter = '';
  protected searchQuery = '';

  ngOnInit(): void {
    this.tenantSlug =
      this.route.parent?.snapshot.paramMap.get('tenantSlug') ??
      this.route.snapshot.paramMap.get('tenantSlug') ??
      '';
    this.loadFilterOptions();
    this.load();
  }

  protected loadFilterOptions(): void {
    this.kasserApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => this.kasser.set(res.items),
    });
    this.staffApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => this.staff.set(res.items),
    });
  }

  protected load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.ordersApi
      .list(this.tenantSlug, {
        page,
        limit: this.limit,
        status: (this.statusFilter || undefined) as OrderStatus | undefined,
        channel: (this.channelFilter || undefined) as PaymentChannel | undefined,
        kasseId: this.kasseFilter || undefined,
        staffUserId: this.staffFilter || undefined,
        paymentMethod: (this.paymentMethodFilter || undefined) as OrderPaymentMethod | undefined,
        q: this.searchQuery || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.page.set(res.page);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not load orders.'));
          this.loading.set(false);
        },
      });
  }

  protected applyFilters(): void {
    this.load(1);
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  protected nextPage(): void {
    if (this.page() * this.limit < this.total()) {
      this.load(this.page() + 1);
    }
  }

  protected statusLabel(status: string): string {
    if (status === 'pending_payment') {
      return 'Pay later';
    }
    return status;
  }

  protected paymentMethodLabel(method: string | null): string {
    if (!method) {
      return 'Not set';
    }
    const labels: Record<string, string> = {
      qr: 'QR',
      later: 'Pay later',
      terminal: 'Terminal',
      sms: 'SMS',
    };
    return labels[method] ?? method;
  }

  protected emptyMessage(): string {
    if (
      this.statusFilter ||
      this.channelFilter ||
      this.kasseFilter ||
      this.staffFilter ||
      this.paymentMethodFilter ||
      this.searchQuery.trim()
    ) {
      return 'No orders match your filters.';
    }
    return 'No orders yet.';
  }

  protected readonly displayOptional = displayOptional;
}
