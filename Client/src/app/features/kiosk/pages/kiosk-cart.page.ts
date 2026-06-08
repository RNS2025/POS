import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartLineComponent } from '../../../shared/components/cart-line/cart-line.component';
import { PosButtonComponent } from '../../../shared/components/pos-button/pos-button.component';
import { KioskCartService } from '../services/kiosk-cart.service';

@Component({
  selector: 'app-kiosk-cart-page',
  imports: [RouterLink, CurrencyPipe, CartLineComponent, PosButtonComponent],
  templateUrl: './kiosk-cart.page.html',
})
export class KioskCartPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly cart = inject(KioskCartService);

  protected tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
  protected kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
}
