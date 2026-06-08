import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { CategorySummary } from '@shared/catalog';
import { CategoriesService } from '../../../../core/services/categories.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { AsyncShellComponent } from '../../../../shared/components/async-shell/async-shell.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { PosButtonComponent } from '../../../../shared/components/pos-button/pos-button.component';

@Component({
  selector: 'app-categories-list-page',
  imports: [
    RouterLink,
    PosButtonComponent,
    PaginatorComponent,
    AsyncShellComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './categories-list.page.html',
})
export class CategoriesListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly categoriesApi = inject(CategoriesService);

  protected tenantSlug = '';
  protected readonly items = signal<CategorySummary[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 50;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly confirmOpen = signal(false);
  protected readonly confirmAction = signal<'deactivate' | 'delete'>('deactivate');
  protected readonly targetId = signal('');
  protected readonly actionLoading = signal(false);

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.load();
  }

  protected load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.categoriesApi.list(this.tenantSlug, page, this.limit).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load categories.'));
        this.loading.set(false);
      },
    });
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  protected nextPage(): void {
    if (this.page() * this.limit < this.total()) {
      this.load(this.page() + 1);
    }
  }

  protected openDeactivate(c: CategorySummary): void {
    this.targetId.set(c.id);
    this.confirmAction.set('deactivate');
    this.confirmOpen.set(true);
  }

  protected openDelete(c: CategorySummary): void {
    this.targetId.set(c.id);
    this.confirmAction.set('delete');
    this.confirmOpen.set(true);
  }

  protected confirmTitle(): string {
    return this.confirmAction() === 'delete' ? 'Delete category?' : 'Deactivate category?';
  }

  protected confirmMessage(): string {
    return this.confirmAction() === 'delete'
      ? 'This category will be permanently removed.'
      : 'Products in this category stay visible; the category is hidden from menus.';
  }

  protected confirmLabel(): string {
    return this.confirmAction() === 'delete' ? 'Delete' : 'Deactivate';
  }

  protected runConfirm(): void {
    const id = this.targetId();
    this.actionLoading.set(true);
    if (this.confirmAction() === 'delete') {
      this.categoriesApi.delete(this.tenantSlug, id).subscribe({
        next: () => {
          this.items.update((list) => list.filter((c) => c.id !== id));
          this.confirmOpen.set(false);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not delete category.'));
          this.confirmOpen.set(false);
          this.actionLoading.set(false);
        },
      });
    } else {
      this.categoriesApi.update(this.tenantSlug, id, { isActive: false }).subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((c) => (c.id === id ? updated : c)));
          this.confirmOpen.set(false);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not deactivate category.'));
          this.confirmOpen.set(false);
          this.actionLoading.set(false);
        },
      });
    }
  }
}
