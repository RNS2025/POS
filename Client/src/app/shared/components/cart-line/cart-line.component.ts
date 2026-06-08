import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'cart-line',
  standalone: true,
  imports: [CurrencyPipe, PosButtonComponent],
  template: `
    <div class="wf-cart-line">
      <span>{{ name() }}</span>
      <span class="wf-qty">
        <pos-button type="button" variant="secondary" (pressed)="decrease.emit()">−</pos-button>
        {{ quantity() }}
        <pos-button type="button" variant="secondary" (pressed)="increase.emit()">+</pos-button>
      </span>
      <span>{{ lineTotalOre() / 100 | currency: 'DKK' }}</span>
      <pos-button type="button" variant="ghost" (pressed)="remove.emit()">×</pos-button>
    </div>
  `,
})
export class CartLineComponent {
  readonly name = input.required<string>();
  readonly quantity = input.required<number>();
  readonly lineTotalOre = input.required<number>();
  readonly increase = output<void>();
  readonly decrease = output<void>();
  readonly remove = output<void>();
}
