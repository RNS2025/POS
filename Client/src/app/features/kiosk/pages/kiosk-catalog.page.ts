import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { KioskCatalogResponse } from '@shared/kiosk';
import { KioskService } from '../../../core/services/kiosk.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { AsyncShellComponent } from '../../../shared/components/async-shell/async-shell.component';
import { KioskCartService } from '../services/kiosk-cart.service';
import { KioskPhoneService } from '../services/kiosk-phone.service';

@Component({
  selector: 'app-kiosk-catalog-page',
  imports: [RouterLink, CurrencyPipe, AsyncShellComponent],
  templateUrl: './kiosk-catalog.page.html',
})
export class KioskCatalogPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly kioskApi = inject(KioskService);
  private readonly cart = inject(KioskCartService);
  private readonly phone = inject(KioskPhoneService);

  protected tenantSlug = '';
  protected kasseSlug = '';
  protected readonly catalog = signal<KioskCatalogResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected selectedCategoryId = '';

  protected readonly cartCount = this.cart.itemCount;
  protected readonly cartTotal = this.cart.totalOre;

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.phone.bind(this.tenantSlug, this.kasseSlug);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.kioskApi.getCatalog(this.tenantSlug, this.kasseSlug).subscribe({
      next: (res) => {
        this.catalog.set(res);
        this.loading.set(false);
        if (res.requirePhoneUpFront && this.phone.current().length < 8) {
          void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug, 'start']);
        }
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load menu.'));
        this.loading.set(false);
      },
    });
  }

  protected filteredProducts() {
    const c = this.catalog();
    if (!c) {
      return [];
    }
    if (!this.selectedCategoryId) {
      return c.products;
    }
    return c.products.filter((p) => p.categoryId === this.selectedCategoryId);
  }

  protected addToCart(productId: string): void {
    const product = this.catalog()?.products.find((p) => p.id === productId);
    if (product) {
      this.cart.addProduct(product);
    }
  }
}
