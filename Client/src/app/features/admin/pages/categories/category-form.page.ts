import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService } from '../../../../core/services/categories.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-category-form-page',
  imports: [FormsModule, FormActionsComponent],
  templateUrl: './category-form.page.html',
})
export class CategoryFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesApi = inject(CategoriesService);

  protected tenantSlug = '';
  protected categoryId = '';
  protected isEdit = false;

  protected name = '';
  protected sortOrder = 0;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.categoryId = this.route.snapshot.paramMap.get('categoryId') ?? '';
    this.isEdit = this.categoryId !== 'new' && this.categoryId.length > 0;
    if (this.isEdit) {
      this.load();
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.categoriesApi.get(this.tenantSlug, this.categoryId).subscribe({
      next: (c) => {
        this.name = c.name;
        this.sortOrder = c.sortOrder;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load category.'));
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');
    const body = { name: this.name, sortOrder: this.sortOrder };
    const req = this.isEdit
      ? this.categoriesApi.update(this.tenantSlug, this.categoryId, body)
      : this.categoriesApi.create(this.tenantSlug, body);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/', this.tenantSlug, 'admin', 'categories']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not save category.'));
        this.saving.set(false);
      },
    });
  }

  protected cancelListLink(): string[] {
    return ['/', this.tenantSlug, 'admin', 'categories'];
  }
}
