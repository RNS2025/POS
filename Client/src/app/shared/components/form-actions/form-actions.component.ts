import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosButtonComponent } from '../pos-button/pos-button.component';

@Component({
  selector: 'form-actions',
  standalone: true,
  imports: [PosButtonComponent, RouterLink],
  template: `
    <div class="wf-form-actions">
      <pos-button type="submit" variant="primary" [loading]="saving()" [disabled]="saveDisabled()">
        {{ saveLabel() }}
      </pos-button>
      @if (cancelLink()) {
        <a class="wf-btn ghost" [routerLink]="cancelLink()!">Cancel</a>
      }
      <ng-content />
    </div>
  `,
})
export class FormActionsComponent {
  readonly saving = input(false);
  readonly saveDisabled = input(false);
  readonly saveLabel = input('Save');
  readonly cancelLink = input<string | (string | number)[] | null>(null);
}
