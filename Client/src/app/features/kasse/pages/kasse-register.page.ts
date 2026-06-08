import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { KasseCatalogResponse } from '@shared/kasse-register';
import { RegisterKasseService } from '../../../core/services/register-kasse.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { CartLineComponent } from '../../../shared/components/cart-line/cart-line.component';
import { NumericPadComponent } from '../../../shared/components/numeric-pad/numeric-pad.component';
import { PosButtonComponent } from '../../../shared/components/pos-button/pos-button.component';
import { KioskCartService } from '../../kiosk/services/kiosk-cart.service';
import { KasseSessionService } from '../services/kasse-session.service';

@Component({
  selector: 'app-kasse-register-page',
  imports: [FormsModule, CurrencyPipe, NumericPadComponent, CartLineComponent, PosButtonComponent],
  templateUrl: './kasse-register.page.html',
})
export class KasseRegisterPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registerApi = inject(RegisterKasseService);
  private readonly session = inject(KasseSessionService);
  protected readonly cart = inject(KioskCartService);

  protected tenantSlug = '';
  protected kasseSlug = '';
  protected readonly catalog = signal<KasseCatalogResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly pinLoading = signal(false);
  protected readonly saleLoading = signal(false);
  protected readonly error = signal('');
  protected readonly pin = signal('');
  protected selectedCategoryId = '';
  protected search = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.session.bind(this.tenantSlug, this.kasseSlug);
    if (this.session.isActive(this.tenantSlug, this.kasseSlug)) {
      this.loadCatalog();
    }
  }

  protected hasSession(): boolean {
    return this.session.isActive(this.tenantSlug, this.kasseSlug);
  }

  protected staffName(): string {
    return this.session.session()?.displayName ?? 'Staff';
  }

  protected appendPin(d: string): void {
    if (this.pin().length < 6) {
      this.pin.update((v) => v + d);
    }
  }

  protected backspacePin(): void {
    this.pin.update((v) => v.slice(0, -1));
  }

  protected clearPin(): void {
    this.pin.set('');
  }

  protected submitPin(): void {
    if (this.pin().length < 4) {
      return;
    }
    this.pinLoading.set(true);
    this.error.set('');
    this.registerApi.loginPin(this.tenantSlug, this.kasseSlug, { pin: this.pin() }).subscribe({
      next: (res) => {
        this.session.save(this.tenantSlug, this.kasseSlug, {
          token: res.token,
          staffUserId: res.staffUserId,
          displayName: res.displayName,
          kasseId: res.kasseId,
        });
        this.pin.set('');
        this.pinLoading.set(false);
        this.loadCatalog();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'PIN not recognised.'));
        this.pinLoading.set(false);
        this.pin.set('');
      },
    });
  }

  protected logout(): void {
    this.session.clear();
    this.cart.clear();
    this.catalog.set(null);
  }

  protected loadCatalog(): void {
    this.loading.set(true);
    this.registerApi.getCatalog(this.tenantSlug, this.kasseSlug).subscribe({
      next: (res) => {
        this.catalog.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load products.'));
        this.loading.set(false);
        if (err.status === 401) {
          this.logout();
        }
      },
    });
  }

  protected filteredProducts() {
    const c = this.catalog();
    if (!c) {
      return [];
    }
    let products = c.products;
    if (this.selectedCategoryId) {
      products = products.filter((p) => p.categoryId === this.selectedCategoryId);
    }
    const q = this.search.trim().toLowerCase();
    if (q) {
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }
    return products;
  }

  protected addToCart(productId: string): void {
    const product = this.catalog()?.products.find((p) => p.id === productId);
    if (product) {
      this.cart.addProduct(product);
    }
  }

  protected canCharge(): boolean {
    return Boolean(this.catalog()?.verifonePoiId?.trim());
  }

  protected chargeCard(): void {
    if (this.cart.items().length === 0) {
      return;
    }
    this.saleLoading.set(true);
    this.error.set('');
    this.registerApi
      .createSale(this.tenantSlug, this.kasseSlug, { lines: this.cart.toCheckoutLines() })
      .subscribe({
        next: (res) => {
          this.saleLoading.set(false);
          this.cart.clear();
          void this.router.navigate(['/', this.tenantSlug, 'kasse', this.kasseSlug, 'receipt'], {
            queryParams: { orderId: res.orderId },
          });
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Terminal payment failed.'));
          this.saleLoading.set(false);
        },
      });
  }

  protected payWithQr(): void {
    if (this.cart.items().length === 0) {
      return;
    }
    this.saleLoading.set(true);
    this.error.set('');
    this.registerApi
      .createQrPayment(this.tenantSlug, this.kasseSlug, { lines: this.cart.toCheckoutLines() })
      .subscribe({
        next: (res) => {
          this.saleLoading.set(false);
          this.cart.clear();
          void this.router.navigate(['/', this.tenantSlug, 'kasse', this.kasseSlug, 'pay', 'qr'], {
            queryParams: { orderId: res.orderId, paymentUrl: res.paymentUrl },
          });
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not start QR payment.'));
          this.saleLoading.set(false);
        },
      });
  }
}
