import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { KasseReceiptResponse } from '@shared/kasse-register';
import { RegisterKasseService } from '../../../core/services/register-kasse.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { AsyncShellComponent } from '../../../shared/components/async-shell/async-shell.component';

@Component({
  selector: 'app-kasse-receipt-page',
  imports: [RouterLink, CurrencyPipe, DatePipe, AsyncShellComponent],
  template: `
    <header class="wf-topbar">
      <a class="wf-btn ghost" [routerLink]="['/', tenantSlug, 'kasse', kasseSlug]">← New sale</a>
      <span class="brand">Approved</span>
    </header>
    <async-shell [loading]="loading()" [error]="error()" [empty]="!receipt()" emptyMessage="Receipt not found.">
      @if (receipt(); as r) {
        <div class="wf-content wf-success">
          <div class="wf-icon-ok kasse-ok">✓</div>
          <h2>{{ r.amountOre / 100 | currency: r.currency }} paid</h2>
          <p class="wf-hint">
            #{{ r.orderId.slice(0, 8) }} · {{ r.staffDisplayName ?? 'Staff' }} · {{ r.kasseName }}
          </p>
          <table class="wf-table wf-narrow-block">
            @for (line of r.lines; track line.nameSnapshot) {
              <tr>
                <td>{{ line.nameSnapshot }} × {{ line.quantity }}</td>
                <td>{{ line.lineTotalOre / 100 | currency: r.currency }}</td>
              </tr>
            }
          </table>
          <p class="wf-hint">{{ r.createdAt | date: 'medium' }}</p>
          <a class="wf-btn kasse block wf-narrow-block" [routerLink]="['/', tenantSlug, 'kasse', kasseSlug]">
            Next sale
          </a>
        </div>
      }
    </async-shell>
  `,
})
export class KasseReceiptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly registerApi = inject(RegisterKasseService);

  protected tenantSlug = '';
  protected kasseSlug = '';
  protected readonly receipt = signal<KasseReceiptResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    const orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    if (!orderId) {
      this.error.set('Missing order.');
      this.loading.set(false);
      return;
    }
    this.registerApi.getReceipt(this.tenantSlug, this.kasseSlug, orderId).subscribe({
      next: (res) => {
        this.receipt.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load receipt.'));
        this.loading.set(false);
      },
    });
  }
}
