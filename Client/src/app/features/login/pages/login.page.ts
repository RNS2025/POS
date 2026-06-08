import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { SessionService } from '../../../core/services/session.service';
import { navigateAfterMerchantLogin } from '../../../core/utils/merchant-login-nav';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected tenantSlug = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected submit(): void {
    this.error.set('');
    this.loading.set(true);

    this.auth
      .login({
        email: this.email,
        password: this.password,
        tenantSlug: this.tenantSlug || undefined,
      })
      .subscribe({
        next: (res) => {
          this.session.setSession(res.token, res.user);
          navigateAfterMerchantLogin(this.router, res.user);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not log you in. Check your shop web address, email, and password.'));
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
