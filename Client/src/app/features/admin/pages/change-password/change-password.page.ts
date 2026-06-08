import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SessionService } from '../../../../core/services/session.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';

@Component({
  selector: 'app-change-password-page',
  imports: [FormsModule],
  templateUrl: './change-password.page.html',
})
export class ChangePasswordPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected tenantSlug = '';
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  constructor() {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
  }

  protected submit(): void {
    this.error.set('');
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('New passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.auth.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: (res) => {
        this.session.setSession(res.token, res.user);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'products']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not change password.'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
