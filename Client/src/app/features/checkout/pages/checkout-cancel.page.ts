import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'app-checkout-cancel-page',
  imports: [RouterLink],
  templateUrl: './checkout-cancel.page.html',
})
export class CheckoutCancelPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrdersService);

  protected tenantSlug = '';
  protected orderId = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    if (this.tenantSlug && this.orderId) {
      this.orders.markCancelled(this.tenantSlug, this.orderId).subscribe();
    }
  }
}
