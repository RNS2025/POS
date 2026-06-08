import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { CategorySummary, KasseSummary } from '@shared/catalog';
import { CategoriesService } from '../../../../core/services/categories.service';
import { KasserService } from '../../../../core/services/kasser.service';
import { ProductsService } from '../../../../core/services/products.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-product-form-page',
  imports: [FormsModule, FormActionsComponent, ConfirmDialogComponent],
  templateUrl: './product-form.page.html',
})
export class ProductFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly kasserApi = inject(KasserService);

  protected tenantSlug = '';
  protected productId = '';
  protected isEdit = false;

  protected name = '';
  protected priceKr = '';
  protected categoryId = '';
  protected isActive = true;
  protected imageFile: File | null = null;
  protected removeImage = false;
  protected existingImageUrl: string | null = null;
  protected readonly kasser = signal<KasseSummary[]>([]);
  protected readonly categories = signal<CategorySummary[]>([]);
  protected selectedKasseIds = new Set<string>();

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly confirmDeactivate = signal(false);

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.productId = this.route.snapshot.paramMap.get('productId') ?? '';
    this.isEdit = this.productId !== 'new' && this.productId.length > 0;
    this.loadLookups();
    if (this.isEdit) {
      this.load();
    }
  }

  protected loadLookups(): void {
    this.categoriesApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => this.categories.set(res.items),
    });
    this.kasserApi.list(this.tenantSlug, 1, 100).subscribe({
      next: (res) => this.kasser.set(res.items),
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.productsApi.get(this.tenantSlug, this.productId).subscribe({
      next: (p) => {
        this.name = p.name;
        this.priceKr = String(p.priceOre / 100);
        this.categoryId = p.categoryId ?? '';
        this.isActive = p.isActive;
        this.existingImageUrl = p.imageUrl;
        this.selectedKasseIds = new Set(p.kasseIds);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load product.'));
        this.loading.set(false);
      },
    });
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageFile = input.files?.[0] ?? null;
    this.removeImage = false;
  }

  protected toggleKasse(id: string, checked: boolean): void {
    if (checked) {
      this.selectedKasseIds.add(id);
    } else {
      this.selectedKasseIds.delete(id);
    }
  }

  protected isKasseSelected(id: string): boolean {
    return this.selectedKasseIds.has(id);
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');
    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('priceOre', String(Math.round(Number(this.priceKr) * 100)));
    formData.append('categoryId', this.categoryId);
    formData.append('kasseIds', JSON.stringify([...this.selectedKasseIds]));
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    if (this.isEdit) {
      formData.append('isActive', String(this.isActive));
      if (this.removeImage) {
        formData.append('removeImage', 'true');
      }
    }

    const req = this.isEdit
      ? this.productsApi.update(this.tenantSlug, this.productId, formData)
      : this.productsApi.create(this.tenantSlug, formData);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'products']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not save product.'));
        this.saving.set(false);
      },
    });
  }

  protected openDeactivate(): void {
    this.confirmDeactivate.set(true);
  }

  protected deactivate(): void {
    this.saving.set(true);
    const formData = new FormData();
    formData.append('isActive', 'false');
    this.productsApi.update(this.tenantSlug, this.productId, formData).subscribe({
      next: () => {
        this.isActive = false;
        this.confirmDeactivate.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not deactivate product.'));
        this.confirmDeactivate.set(false);
        this.saving.set(false);
      },
    });
  }

  protected cancelListLink(): string[] {
    return ['/', this.tenantSlug, 'admin', 'products'];
  }
}
