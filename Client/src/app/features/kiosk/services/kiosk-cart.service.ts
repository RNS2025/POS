import { Injectable, computed, signal } from '@angular/core';
import type { KioskProduct } from '@shared/kiosk';

export interface KioskCartLine {
  product: KioskProduct;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class KioskCartService {
  private readonly lines = signal<KioskCartLine[]>([]);

  readonly items = this.lines.asReadonly();
  readonly totalOre = computed(() =>
    this.lines().reduce((sum, l) => sum + l.product.priceOre * l.quantity, 0),
  );
  readonly itemCount = computed(() =>
    this.lines().reduce((sum, l) => sum + l.quantity, 0),
  );

  clear(): void {
    this.lines.set([]);
  }

  addProduct(product: KioskProduct): void {
    const existing = this.lines().find((l) => l.product.id === product.id);
    if (existing) {
      this.lines.update((list) =>
        list.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        ),
      );
    } else {
      this.lines.update((list) => [...list, { product, quantity: 1 }]);
    }
  }

  increase(productId: string): void {
    this.lines.update((list) =>
      list.map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + 1 } : l)),
    );
  }

  decrease(productId: string): void {
    this.lines.update((list) =>
      list
        .map((l) =>
          l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  remove(productId: string): void {
    this.lines.update((list) => list.filter((l) => l.product.id !== productId));
  }

  toCheckoutLines(): { productId: string; quantity: number }[] {
    return this.lines().map((l) => ({ productId: l.product.id, quantity: l.quantity }));
  }
}
