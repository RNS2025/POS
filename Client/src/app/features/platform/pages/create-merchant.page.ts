import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoutLink } from '../../../core/components/logout-link';
import { PlatformService } from '../../../core/services/platform.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-create-merchant-page',
  imports: [FormsModule, RouterLink, LogoutLink],
  templateUrl: './create-merchant.page.html',
})
export class CreateMerchantPage {
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);

  protected shopName = '';
  protected slug = '';
  protected adminEmail = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly inviteUrl = signal('');
  protected readonly created = signal(false);

  protected submit(): void {
    this.error.set('');
    this.loading.set(true);

    this.platform
      .createMerchant({
        shopName: this.shopName,
        slug: this.slug,
        adminEmail: this.adminEmail,
      })
      .subscribe({
        next: (res) => {
          this.inviteUrl.set(res.inviteUrl);
          this.created.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not create the merchant. Check the form and try again.'));
          this.loading.set(false);
        },
      });
  }

  protected openMerchant(): void {
    void this.router.navigate(['/platform', 'merchants']);
  }
}
