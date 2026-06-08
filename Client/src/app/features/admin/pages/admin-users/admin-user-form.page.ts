import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { MerchantAdminRole } from '@shared/auth';
import { AdminUsersService } from '../../../../core/services/admin-users.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-admin-user-form-page',
  imports: [FormsModule, FormActionsComponent],
  templateUrl: './admin-user-form.page.html',
})
export class AdminUserFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminUsersApi = inject(AdminUsersService);

  protected tenantSlug = '';
  protected userId = '';
  protected isEdit = false;
  protected email = '';
  protected displayName = '';
  protected role: MerchantAdminRole = 'manager';
  protected temporaryPassword = '';
  protected resetPassword = '';
  protected isActive = true;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.userId = this.route.snapshot.paramMap.get('userId') ?? '';
    this.isEdit = this.userId !== 'new' && this.userId.length > 0;
    if (this.isEdit) {
      this.load();
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.adminUsersApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => {
        const user = res.items.find((u) => u.id === this.userId);
        if (!user) {
          this.error.set('Admin user not found.');
          this.loading.set(false);
          return;
        }
        this.email = user.email;
        this.displayName = user.displayName;
        this.role = user.role;
        this.isActive = user.isActive;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load admin user.'));
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');

    if (this.isEdit) {
      this.adminUsersApi
        .update(this.tenantSlug, this.userId, {
          displayName: this.displayName,
          role: this.role,
          isActive: this.isActive,
        })
        .subscribe({
          next: () => this.afterSave(),
          error: (err) => this.onSaveError(err),
        });
      return;
    }

    this.adminUsersApi
      .create(this.tenantSlug, {
        email: this.email,
        displayName: this.displayName,
        role: this.role,
        temporaryPassword: this.temporaryPassword,
      })
      .subscribe({
        next: () => this.afterSave(),
        error: (err) => this.onSaveError(err),
      });
  }

  protected resetTempPassword(): void {
    if (!this.resetPassword.trim()) {
      this.error.set('Enter a temporary password.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.adminUsersApi.resetPassword(this.tenantSlug, this.userId, { temporaryPassword: this.resetPassword }).subscribe({
      next: () => {
        this.resetPassword = '';
        this.saving.set(false);
        this.error.set('');
      },
      error: (err) => this.onSaveError(err),
    });
  }

  private afterSave(): void {
    this.saving.set(false);
    void this.router.navigate(['/', this.tenantSlug, 'admin', 'users']);
  }

  private onSaveError(err: unknown): void {
    this.error.set(apiErrorMessage(err, 'Could not save admin user.'));
    this.saving.set(false);
  }
}
