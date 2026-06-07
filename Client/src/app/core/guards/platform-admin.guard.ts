import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const platformAdminGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (session.user()?.role === 'platform_admin') {
    return true;
  }

  return router.createUrlTree(['/login']);
};
