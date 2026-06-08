import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const mustChangePasswordGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const user = session.user();
  const tenantSlug =
    route.parent?.paramMap.get('tenantSlug') ?? route.paramMap.get('tenantSlug') ?? user?.tenantSlug ?? '';

  if (user?.mustChangePassword && user.tenantSlug) {
    return router.createUrlTree(['/', user.tenantSlug, 'admin', 'change-password']);
  }

  return true;
};

export const changePasswordOnlyGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const user = session.user();

  if (!user?.mustChangePassword) {
    const tenantSlug =
      route.parent?.paramMap.get('tenantSlug') ?? route.paramMap.get('tenantSlug') ?? user?.tenantSlug ?? 'products';
    return router.createUrlTree(['/', tenantSlug, 'admin', 'products']);
  }

  return true;
};
