import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckoutService } from '../../../core/services/checkout.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { invalidShopSlugMessage, isValidShopSlug } from '../../../core/utils/shop-slug';

@Component({
  selector: 'app-checkout-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './checkout.page.html',
})
export class CheckoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkout = inject(CheckoutService);

  protected amountDkk = 100;
  protected email = '';
  protected description = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected tenantSlug = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    if (!isValidShopSlug(this.tenantSlug)) {
      this.error.set(invalidShopSlugMessage(this.tenantSlug));
    }
  }

  protected submit(): void {
    if (!isValidShopSlug(this.tenantSlug)) {
      this.error.set(invalidShopSlugMessage(this.tenantSlug));
      return;
    }

    this.error.set('');
    this.loading.set(true);

    const amountOre = Math.round(this.amountDkk * 100);
    this.checkout
      .createCheckout(this.tenantSlug, {
        amountOre,
        customerEmail: this.email || undefined,
        description: this.description || undefined,
      })
      .subscribe({
        next: (res) => {
          window.location.href = res.paymentUrl;
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not start payment. Try again.'));
          this.loading.set(false);
        },
      });
  }
}
