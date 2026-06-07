import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { isValidShopSlug } from '../../../core/utils/shop-slug';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  protected tenantSlug = '';
  protected isValidSlug = false;
  protected readonly status = signal<string>('');

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    this.isValidSlug = isValidShopSlug(this.tenantSlug);
    this.api.getHealth().subscribe({
      next: (res) => {
        this.status.set(`API ${res.status} · DB ${res.db}`);
      },
      error: () => {
        this.status.set('API unreachable');
      },
    });
  }
}
