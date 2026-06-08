import { Component, effect, input, signal } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'qr-code',
  standalone: true,
  template: `
    @if (dataUrl()) {
      <img
        [src]="dataUrl()"
        [width]="size()"
        [height]="size()"
        role="img"
        [attr.aria-label]="ariaLabel()"
        alt=""
      />
    }
  `,
})
export class QrCodeComponent {
  readonly value = input.required<string>();
  readonly size = input(200);
  readonly ariaLabel = input('QR code for payment');

  protected readonly dataUrl = signal('');

  constructor() {
    effect(() => {
      const url = this.value().trim();
      if (!url) {
        this.dataUrl.set('');
        return;
      }

      void QRCode.toDataURL(url, {
        width: this.size(),
        margin: 1,
        errorCorrectionLevel: 'M',
      })
        .then((dataUrl) => this.dataUrl.set(dataUrl))
        .catch(() => this.dataUrl.set(''));
    });
  }
}
