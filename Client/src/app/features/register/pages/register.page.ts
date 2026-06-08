import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { SessionService } from '../../../core/services/session.service';
import { navigateAfterMerchantLogin } from '../../../core/utils/merchant-login-nav';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected shopName = '';
  protected slug = '';
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected submit(): void {
    this.error.set('');
    this.loading.set(true);

    this.auth
      .register({
        shopName: this.shopName,
        slug: this.slug,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.session.setSession(res.token, res.user);
          if (res.user.tenantSlug) {
            void this.router.navigate(['/', res.user.tenantSlug, 'admin', 'setup']);
          } else {
            navigateAfterMerchantLogin(this.router, res.user);
          }
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not create your shop. Check the form and try again.'));
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
