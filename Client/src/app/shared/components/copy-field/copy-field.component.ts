import { Component, input, signal } from '@angular/core';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'copy-field',
  standalone: true,
  imports: [PosButtonComponent],
  template: `
    <div class="wf-link-row">
      <input class="wf-input" [value]="value()" readonly [attr.aria-label]="ariaLabel()" />
      <pos-button type="button" variant="secondary" (pressed)="copy()">
        {{ copied() ? 'Copied' : 'Copy' }}
      </pos-button>
    </div>
  `,
})
export class CopyFieldComponent {
  readonly value = input.required<string>();
  readonly ariaLabel = input('Copy value');

  protected readonly copied = signal(false);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }
}
