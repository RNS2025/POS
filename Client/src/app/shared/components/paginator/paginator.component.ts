import { Component, computed, input, output } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'pos-paginator',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <div class="wf-paginator">
      <span>Page {{ page() }} — {{ total() }} total</span>
      <pos-button type="button" variant="secondary" [disabled]="!canPrev()" (pressed)="prev.emit()">
        Previous
      </pos-button>
      <pos-button type="button" variant="secondary" [disabled]="!canNext()" (pressed)="next.emit()">
        Next
      </pos-button>
    </div>
  `,
})
export class PaginatorComponent {
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  readonly limit = input(20);
  readonly hasMore = input<boolean | undefined>(undefined);

  readonly prev = output<void>();
  readonly next = output<void>();

  protected readonly canPrev = computed(() => this.page() > 1);
  protected readonly canNext = computed(() => {
    const hm = this.hasMore();
    if (hm !== undefined) {
      return hm;
    }
    return this.page() * this.limit() < this.total();
  });
}
