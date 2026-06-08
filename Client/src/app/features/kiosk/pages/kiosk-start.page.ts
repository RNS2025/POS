import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NumericPadComponent } from '../../../shared/components/numeric-pad/numeric-pad.component';
import { KioskPhoneService } from '../services/kiosk-phone.service';

@Component({
  selector: 'app-kiosk-start-page',
  imports: [NumericPadComponent],
  template: `
    <div class="page-title">
      <h1>Enter phone number</h1>
      <p>Required for pay later or SMS payment.</p>
    </div>
    <p class="wf-pin-display">{{ phone.value() || '—' }}</p>
    <numeric-pad okLabel="Start" (digit)="phone.append($event)" (backspace)="phone.backspace()" (clear)="phone.clear()" (submit)="start()" />
  `,
})
export class KioskStartPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly phone = inject(KioskPhoneService);

  private tenantSlug = '';
  private kasseSlug = '';

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseSlug = this.route.parent?.snapshot.paramMap.get('kasseSlug') ?? '';
    this.phone.bind(this.tenantSlug, this.kasseSlug);
  }

  protected start(): void {
    if (this.phone.value().length < 8) {
      return;
    }
    this.phone.save();
    void this.router.navigate(['/', this.tenantSlug, 'kiosk', this.kasseSlug]);
  }
}
