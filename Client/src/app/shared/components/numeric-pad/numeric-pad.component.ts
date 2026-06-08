import { Component, input, output } from '@angular/core';

@Component({
  selector: 'numeric-pad',
  standalone: true,
  imports: [],
  template: `
    <div class="wf-pinpad">
      @for (d of digits; track d) {
        <button type="button" class="wf-btn" (click)="digit.emit(d)">{{ d }}</button>
      }
      <button type="button" class="wf-btn" (click)="backspace.emit()">⌫</button>
      <button type="button" class="wf-btn wide" (click)="clear.emit()">Clear</button>
      <button type="button" class="wf-btn primary wide" (click)="submit.emit()">{{ okLabel() }}</button>
    </div>
  `,
})
export class NumericPadComponent {
  readonly okLabel = input('OK');
  readonly digit = output<string>();
  readonly backspace = output<void>();
  readonly clear = output<void>();
  readonly submit = output<void>();

  protected readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
}
