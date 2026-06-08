import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-staff-form-page',
  imports: [FormsModule, FormActionsComponent, ConfirmDialogComponent],
  templateUrl: './staff-form.page.html',
})
export class StaffFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly staffApi = inject(StaffService);

  protected tenantSlug = '';
  protected staffId = '';
  protected isEdit = false;
  protected displayName = '';
  protected pin = '';
  protected isActive = true;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly confirmDeactivate = signal(false);

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.staffId = this.route.snapshot.paramMap.get('staffId') ?? '';
    this.isEdit = this.staffId !== 'new' && this.staffId.length > 0;
    if (this.isEdit) {
      this.load();
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.staffApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => {
        const staff = res.items.find((s) => s.id === this.staffId);
        if (!staff) {
          this.error.set('Staff member not found.');
          this.loading.set(false);
          return;
        }
        this.displayName = staff.displayName;
        this.isActive = staff.isActive;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load staff.'));
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');

    const req = this.isEdit
      ? this.staffApi.update(this.tenantSlug, this.staffId, {
          displayName: this.displayName,
          isActive: this.isActive,
          ...(this.pin ? { pin: this.pin } : {}),
        })
      : this.staffApi.create(this.tenantSlug, { displayName: this.displayName, pin: this.pin });

    req.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'staff']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not save staff.'));
        this.saving.set(false);
      },
    });
  }

  protected deactivate(): void {
    this.staffApi.update(this.tenantSlug, this.staffId, { isActive: false }).subscribe({
      next: () => {
        this.confirmDeactivate.set(false);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'staff']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not deactivate staff.'));
        this.confirmDeactivate.set(false);
      },
    });
  }
}
