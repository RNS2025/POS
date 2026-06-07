import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const tenantSlugGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const slug = route.paramMap.get('tenantSlug');
  const user = session.user();

  if (!user || user.role === 'platform_admin') {
    return true;
  }

  if (user.tenantSlug === slug) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
