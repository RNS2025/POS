import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { CreateKasseRequest, KasseType, UpdateKasseRequest } from '@shared/catalog';
import { KasserService } from '../../../../core/services/kasser.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CopyFieldComponent } from '../../../../shared/components/copy-field/copy-field.component';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-kasse-form-page',
  imports: [FormsModule, FormActionsComponent, CopyFieldComponent, ConfirmDialogComponent],
  templateUrl: './kasse-form.page.html',
})
export class KasseFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly kasserApi = inject(KasserService);

  protected tenantSlug = '';
  protected kasseId = '';
  protected isEdit = false;

  protected type: KasseType = 'kiosk';
  protected name = '';
  protected slug = '';
  protected verifonePoiId = '';
  protected payWithQrEnabled = true;
  protected payWithSmsEnabled = false;
  protected payWithLaterEnabled = false;
  protected payWithTerminalEnabled = false;
  protected isActive = true;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly confirmDeactivate = signal(false);

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.kasseId = this.route.snapshot.paramMap.get('kasseId') ?? '';
    this.isEdit = this.kasseId !== 'new' && this.kasseId.length > 0;
    if (this.isEdit) {
      this.load();
    }
  }

  protected kioskUrl(): string {
    const path = this.type === 'kiosk' ? 'kiosk' : 'kasse';
    return `${window.location.host}/${this.tenantSlug}/${path}/${this.slug}`;
  }

  protected load(): void {
    this.loading.set(true);
    this.kasserApi.get(this.tenantSlug, this.kasseId).subscribe({
      next: (k) => {
        this.type = k.type;
        this.name = k.name;
        this.slug = k.slug;
        this.verifonePoiId = k.verifonePoiId ?? '';
        this.payWithQrEnabled = k.payWithQrEnabled;
        this.payWithSmsEnabled = k.payWithSmsEnabled;
        this.payWithLaterEnabled = k.payWithLaterEnabled;
        this.payWithTerminalEnabled = k.payWithTerminalEnabled;
        this.isActive = k.isActive;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load kasse.'));
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');

    const req = this.isEdit
      ? this.kasserApi.update(this.tenantSlug, this.kasseId, this.buildUpdateBody())
      : this.kasserApi.create(this.tenantSlug, this.buildCreateBody());

    req.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'kasser']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not save kasse.'));
        this.saving.set(false);
      },
    });
  }

  private buildCreateBody(): CreateKasseRequest {
    if (this.type === 'kiosk') {
      return {
        type: this.type,
        name: this.name,
        slug: this.slug,
        payWithQrEnabled: this.payWithQrEnabled,
        payWithSmsEnabled: this.payWithSmsEnabled,
        payWithLaterEnabled: this.payWithLaterEnabled,
        payWithTerminalEnabled: this.payWithTerminalEnabled,
        verifonePoiId: this.payWithTerminalEnabled ? this.verifonePoiId.trim() : undefined,
      };
    }

    const poi = this.verifonePoiId.trim();
    return {
      type: this.type,
      name: this.name,
      slug: this.slug,
      verifonePoiId: poi || undefined,
    };
  }

  private buildUpdateBody(): UpdateKasseRequest {
    if (this.type === 'kiosk') {
      return {
        type: this.type,
        name: this.name,
        slug: this.slug,
        payWithQrEnabled: this.payWithQrEnabled,
        payWithSmsEnabled: this.payWithSmsEnabled,
        payWithLaterEnabled: this.payWithLaterEnabled,
        payWithTerminalEnabled: this.payWithTerminalEnabled,
        verifonePoiId: this.payWithTerminalEnabled ? this.verifonePoiId.trim() || null : null,
        isActive: this.isActive,
      };
    }

    const poi = this.verifonePoiId.trim();
    return {
      type: this.type,
      name: this.name,
      slug: this.slug,
      verifonePoiId: poi || null,
      isActive: this.isActive,
    };
  }

  protected openDeactivate(): void {
    this.confirmDeactivate.set(true);
  }

  protected deactivate(): void {
    this.saving.set(true);
    this.kasserApi.update(this.tenantSlug, this.kasseId, { isActive: false }).subscribe({
      next: () => {
        this.isActive = false;
        this.confirmDeactivate.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not deactivate kasse.'));
        this.confirmDeactivate.set(false);
        this.saving.set(false);
      },
    });
  }

  protected cancelListLink(): string[] {
    return ['/', this.tenantSlug, 'admin', 'kasser'];
  }
}
