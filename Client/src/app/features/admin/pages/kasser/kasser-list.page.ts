import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { KasseSummary } from '@shared/catalog';
import { KasserService } from '../../../../core/services/kasser.service';
import { apiErrorMessage } from '../../../../core/utils/api-error';
import { AsyncShellComponent } from '../../../../shared/components/async-shell/async-shell.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-kasser-list-page',
  imports: [RouterLink, PaginatorComponent, AsyncShellComponent],
  templateUrl: './kasser-list.page.html',
})
export class KasserListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly kasserApi = inject(KasserService);

  protected tenantSlug = '';
  protected readonly items = signal<KasseSummary[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.tenantSlug = this.route.parent?.snapshot.paramMap.get('tenantSlug') ?? '';
    this.load();
  }

  protected load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.kasserApi.list(this.tenantSlug, page, this.limit).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not load kasser.'));
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
}
