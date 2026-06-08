import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PlatformMerchantDetail, PlatformOrderSummary } from '@shared/platform';
import { LogoutLink } from '../../../core/components/logout-link';
import { PlatformService } from '../../../core/services/platform.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { merchantStatusLabel, tenantLifecycleLabel } from '../../../core/utils/merchant-status';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-platform-merchant-detail',
  imports: [FormsModule, RouterLink, LogoutLink, DatePipe, CurrencyPipe, ConfirmDialogComponent],
  templateUrl: './merchant-detail.page.html',
})
export class MerchantDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformService);

  protected readonly merchant = signal<PlatformMerchantDetail | null>(null);
  protected readonly orders = signal<PlatformOrderSummary[]>([]);
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly pinging = signal(false);
  protected readonly savingQuickpay = signal(false);
  protected readonly savingNote = signal(false);
  protected readonly exporting = signal(false);
  protected readonly archiving = signal(false);
  protected readonly confirmArchiveOpen = signal(false);

  protected noteBody = '';
  protected archiveConfirmName = '';
  protected quickpayMerchantId = '';
  protected quickpayPrivateKey = '';
  protected quickpayApiKey = '';
  protected readonly statusLabel = merchantStatusLabel;
  protected readonly lifecycleLabel = tenantLifecycleLabel;

  private tenantId = '';

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('tenantId') ?? '';
    this.load();
    this.loadOrders();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');

    this.platform.getMerchant(this.tenantId).subscribe({
      next: (res) => {
        this.merchant.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load this merchant. Try again.'));
        this.loading.set(false);
      },
    });
  }

  protected loadOrders(): void {
    this.platform.listMerchantOrders(this.tenantId).subscribe({
      next: (res) => this.orders.set(res.items),
      error: () => undefined,
    });
  }

  protected saveQuickpay(): void {
    this.savingQuickpay.set(true);
    this.error.set('');

    this.platform
      .saveMerchantQuickpay(this.tenantId, {
        merchantId: this.quickpayMerchantId.trim(),
        privateKey: this.quickpayPrivateKey.trim() || undefined,
        apiKey: this.quickpayApiKey.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.merchant.set(res);
          this.quickpayMerchantId = '';
          this.quickpayPrivateKey = '';
          this.quickpayApiKey = '';
          this.savingQuickpay.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not save Quickpay keys.'));
          this.savingQuickpay.set(false);
        },
      });
  }

  protected pingQuickpay(): void {
    this.pinging.set(true);
    this.error.set('');

    this.platform.pingQuickpay(this.tenantId).subscribe({
      next: (res) => {
        this.merchant.set(res);
        this.pinging.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Quickpay test failed. Check the merchant keys.'));
        this.pinging.set(false);
      },
    });
  }

  protected exportData(): void {
    this.exporting.set(true);
    this.error.set('');

    this.platform.exportMerchantData(this.tenantId).subscribe({
      next: (blob) => {
        const m = this.merchant();
        const slug = m?.slug ?? 'merchant';
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${slug}-export.zip`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not export merchant data.'));
        this.exporting.set(false);
      },
    });
  }

  protected openArchiveDialog(): void {
    this.archiveConfirmName = '';
    this.confirmArchiveOpen.set(true);
  }

  protected cancelArchive(): void {
    this.confirmArchiveOpen.set(false);
    this.archiveConfirmName = '';
  }

  protected archiveMerchant(): void {
    const m = this.merchant();
    if (!m) {
      return;
    }

    this.archiving.set(true);
    this.error.set('');

    this.platform.archiveMerchant(this.tenantId, { confirmName: this.archiveConfirmName.trim() }).subscribe({
      next: (res) => {
        this.merchant.set(res.merchant);
        this.confirmArchiveOpen.set(false);
        this.archiveConfirmName = '';
        this.archiving.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not archive this merchant.'));
        this.archiving.set(false);
      },
    });
  }

  protected addNote(): void {
    const body = this.noteBody.trim();
    if (!body) {
      return;
    }

    this.savingNote.set(true);
    this.error.set('');

    this.platform.addNote(this.tenantId, { body }).subscribe({
      next: (note) => {
        const current = this.merchant();
        if (current) {
          this.merchant.set({ ...current, notes: [note, ...current.notes] });
        }
        this.noteBody = '';
        this.savingNote.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not save the note.'));
        this.savingNote.set(false);
      },
    });
  }
}
