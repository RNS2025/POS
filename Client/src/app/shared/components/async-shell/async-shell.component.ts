import { Component, input } from '@angular/core';

@Component({
  selector: 'async-shell',
  standalone: true,
  template: `
    @if (loading()) {
      <p class="wf-loading">{{ loadingMessage() }}</p>
    } @else if (error()) {
      <p class="wf-alert error">{{ error() }}</p>
    } @else if (empty()) {
      <p class="wf-empty">{{ emptyMessage() }}</p>
    } @else {
      <ng-content />
    }
  `,
})
export class AsyncShellComponent {
  readonly loading = input(false);
  readonly error = input('');
  readonly empty = input(false);
  readonly loadingMessage = input('Loading…');
  readonly emptyMessage = input('No items found.');
}
