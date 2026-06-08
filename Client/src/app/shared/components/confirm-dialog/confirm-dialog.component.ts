import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'confirm-dialog',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <dialog #dialog class="pos-dialog" (cancel)="onCancel($event)">
      <div class="pos-dialog__inner">
        <form method="dialog" (submit)="$event.preventDefault()">
          @if (title()) {
            <h2>{{ title() }}</h2>
          }
          @if (message()) {
            <p>{{ message() }}</p>
          }
          <ng-content />
          <div class="pos-dialog__actions">
            <pos-button
              type="button"
              [variant]="confirmVariant()"
              [loading]="confirmLoading()"
              (pressed)="onConfirm()"
            >
              {{ confirmLabel() }}
            </pos-button>
            <pos-button type="button" variant="ghost" (pressed)="onCancelClick()">
              {{ cancelLabel() }}
            </pos-button>
          </div>
        </form>
      </div>
    </dialog>
  `,
})
export class ConfirmDialogComponent {
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmVariant = input<'primary' | 'danger'>('danger');
  readonly confirmLoading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancelClick(): void {
    this.dialogEl().nativeElement.close();
    this.cancelled.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.cancelled.emit();
  }
}
