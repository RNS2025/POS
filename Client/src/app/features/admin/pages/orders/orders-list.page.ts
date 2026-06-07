import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LogoutLink } from '../../../../core/components/logout-link';
import { OrdersService } from '../../../../core/services/orders.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import type { OrderListItem, PaymentChannel } from '@shared/orders';
import type { OrderStatus } from '@shared/checkout';

@Component({
  selector: 'app-orders-list-page',
  imports: [FormsModule, RouterLink, LogoutLink, CurrencyPipe, DatePipe],
  templateUrl: './orders-list.page.html',
})
export class OrdersListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersService);

  protected tenantSlug = '';
  protected readonly items = signal<OrderListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected statusFilter = '';
  protected channelFilter = '';
  protected searchQuery = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.load();
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
}
