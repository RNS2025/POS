import { Component, input, output } from '@angular/core';

export type PosButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'pos-button',
  standalone: true,
  template: `
    <button
      class="wf-btn"
      [class.primary]="variant() === 'primary'"
      [class.danger]="variant() === 'danger'"
      [class.ghost]="variant() === 'ghost'"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span aria-hidden="true">…</span>
      }
      <ng-content />
    </button>
  `,
})
export class PosButtonComponent {
  readonly variant = input<PosButtonVariant>('secondary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly pressed = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.type() === 'button') {
      event.preventDefault();
    }
    this.pressed.emit(event);
  }
}
