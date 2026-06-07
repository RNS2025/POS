import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { SetupResponse } from '@shared/setup';
import { LogoutLink } from '../../../core/components/logout-link';
import { SetupService } from '../../../core/services/setup.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-setup-page',
  imports: [FormsModule, LogoutLink, RouterLink],
  templateUrl: './setup.page.html',
})
export class SetupPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly setupService = inject(SetupService);

  protected merchantId = '';
  protected privateKey = '';
  protected apiKey = '';
  protected verifoneUserUid = '';
  protected verifoneApiKey = '';
  protected verifonePoiId = '';
  protected verifoneSaleId = '';
  protected verifoneUseSimulator = true;
  protected tenantSlug = '';
  protected readonly setup = signal<SetupResponse | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly savingVerifone = signal(false);

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.loadSetup();
  }

  protected loadSetup(): void {
    this.loading.set(true);
    this.setupService.getSetup(this.tenantSlug).subscribe({
      next: (res) => {
        this.setup.set(res);
        if (res.quickpay) {
          this.merchantId = res.quickpay.merchantId;
        }
        if (res.verifone) {
          this.verifoneUserUid = res.verifone.userUid;
          this.verifonePoiId = res.verifone.poiId;
          this.verifoneSaleId = res.verifone.saleId;
          this.verifoneUseSimulator = res.verifone.useSimulator;
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load your shop setup. Try refreshing the page.'));
        this.loading.set(false);
      },
    });
  }

  protected saveQuickpay(): void {
    this.error.set('');
    this.saving.set(true);

    this.setupService
      .saveQuickpay(this.tenantSlug, {
        merchantId: this.merchantId,
        privateKey: this.privateKey,
        apiKey: this.apiKey,
      })
      .subscribe({
        next: (res) => {
          this.setup.set(res);
          this.privateKey = '';
          this.apiKey = '';
          this.saving.set(false);
          if (!res.quickpayConnected && res.lastPingError) {
            this.error.set(res.lastPingError);
          }
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not save your Quickpay settings. Check the fields and try again.'));
          this.saving.set(false);
        },
      });
  }

  protected saveVerifone(): void {
    this.error.set('');
    this.savingVerifone.set(true);

    this.setupService
      .saveVerifone(this.tenantSlug, {
        userUid: this.verifoneUserUid,
        apiKey: this.verifoneApiKey,
        poiId: this.verifonePoiId,
        saleId: this.verifoneSaleId,
        useSimulator: this.verifoneUseSimulator,
      })
      .subscribe({
        next: (res) => {
          this.setup.set(res);
          this.verifoneApiKey = '';
          this.savingVerifone.set(false);
          if (!res.verifoneConnected && res.verifoneLastPingError) {
            this.error.set(res.verifoneLastPingError);
          }
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not save Verifone settings. Check the fields and try again.'));
          this.savingVerifone.set(false);
        },
      });
  }
}
