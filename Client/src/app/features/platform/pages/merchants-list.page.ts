import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { MerchantStatus, PlatformDashboardStats, PlatformMerchantSummary } from '@shared/platform';
import { LogoutLink } from '../../../core/components/logout-link';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { PosButtonComponent } from '../../../shared/components/pos-button/pos-button.component';
import { PlatformService } from '../../../core/services/platform.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { merchantStatusLabel } from '../../../core/utils/merchant-status';

const STATUS_OPTIONS: { value: '' | MerchantStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'registered', label: 'Registered' },
  { value: 'quickpay_connected', label: 'Quickpay connected' },
  { value: 'live', label: 'Live' },
  { value: 'attention', label: 'Needs attention' },
];

@Component({
  selector: 'app-platform-merchants-list',
  imports: [FormsModule, RouterLink, LogoutLink, DatePipe, PosButtonComponent, PaginatorComponent],
  templateUrl: './merchants-list.page.html',
})
export class MerchantsListPage implements OnInit {
  private readonly platform = inject(PlatformService);

  protected readonly merchants = signal<PlatformMerchantSummary[]>([]);
  protected readonly stats = signal<PlatformDashboardStats | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly hasMore = signal(false);

  protected search = '';
  protected statusFilter: '' | MerchantStatus = '';
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabel = merchantStatusLabel;

  ngOnInit(): void {
    this.loadStats();
    this.load();
  }

  protected loadStats(): void {
    this.platform.getDashboardStats().subscribe({
      next: (res) => this.stats.set(res),
      error: () => undefined,
    });
  }

  protected load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');

    this.platform
      .listMerchants({
        page,
        limit: 20,
        search: this.search || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.merchants.set(res.items);
          this.page.set(res.page);
          this.total.set(res.total);
          this.hasMore.set(res.hasMore);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not load merchants. Try again.'));
          this.loading.set(false);
        },
      });
  }

  protected applyFilters(): void {
    this.load(1);
  }

  protected nextPage(): void {
    if (this.hasMore()) {
      this.load(this.page() + 1);
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  protected exportCsv(): void {
    this.platform
      .exportMerchantsCsv({
        search: this.search || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'merchants.csv';
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not export merchants.'));
        },
      });
  }
}
