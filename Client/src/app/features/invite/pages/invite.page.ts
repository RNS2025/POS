import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { InvitePreview } from '@shared/invite';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-invite-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './invite.page.html',
})
export class InvitePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected password = '';
  protected readonly invite = signal<InvitePreview | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.loadInvite();
  }

  protected loadInvite(): void {
    this.loading.set(true);
    this.auth.getInvite(this.token).subscribe({
      next: (res) => {
        this.invite.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'This invite link is not valid.'));
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    this.error.set('');
    this.submitting.set(true);

    this.auth.acceptInvite(this.token, { password: this.password }).subscribe({
      next: (res) => {
        this.session.setSession(res.token, res.user);
        void this.router.navigate(['/', res.user.tenantSlug, 'admin', 'setup']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Could not complete your invite. Try again or contact RNS support.'));
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false),
    });
  }
}
