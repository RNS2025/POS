import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { KioskCatalogResponse } from '@shared/kiosk';
import { KioskService } from '../../../core/services/kiosk.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { PosButtonComponent } from '../../../shared/components/pos-button/pos-button.component';
import { KioskCartService } from '../services/kiosk-cart.service';
import { KioskPhoneService } from '../services/kiosk-phone.service';

@Component({
  selector: 'app-kiosk-checkout-page',
  imports: [RouterLink, CurrencyPipe, PosButtonComponent],
  templateUrl: './kiosk-checkout.page.html',
})
export class KioskCheckoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly kioskApi = inject(KioskService);
  protected readonly cart = inject(KioskCartService);
  private readonly phone = inject(KioskPhoneService);

  protected tenantSlug = '';
  protected kasseSlug = '';
  protected readonly catalog = signal<KioskCatalogResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.phone.bind(this.tenantSlug, this.kasseSlug);
    this.kioskApi.getCatalog(this.tenantSlug, this.kasseSlug).subscribe({
      next: (res) => this.catalog.set(res),
    });
  }

  protected pay(method: 'qr' | 'later' | 'terminal'): void {
    if (this.cart.items().length === 0) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.kioskApi
      .checkout(this.tenantSlug, this.kasseSlug, {
        paymentMethod: method,
        lines: this.cart.toCheckoutLines(),
        customerPhone: this.phone.current() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if ('paymentUrl' in res) {
            this.cart.clear();
            void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'checkout', 'qr'], {
              queryParams: { orderId: res.orderId, paymentUrl: res.paymentUrl },
            });
          } else if ('channel' in res && res.channel === 'terminal') {
            this.cart.clear();
            void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'checkout', 'success'], {
              queryParams: { orderId: res.orderId },
            });
          } else {
            this.cart.clear();
            void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'checkout', 'later'], {
              queryParams: { orderId: res.orderId },
            });
          }
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Checkout failed.'));
          this.loading.set(false);
        },
      });
  }
}
