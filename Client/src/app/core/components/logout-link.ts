import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-logout-link',
  template: `
    @if (loggedIn()) {
      <p>
        Logged in as {{ email() }}.
        <button type="button" (click)="logout()">Log out</button>
      </p>
    }
  `,
})
export class LogoutLink {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly loggedIn = computed(() => this.session.isLoggedIn());
  protected readonly email = computed(() => this.session.user()?.email ?? '');

  protected logout(): void {
    this.session.clearSession();
    void this.router.navigate(['/login']);
  }
}
