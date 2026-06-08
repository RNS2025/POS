import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { AdminPermission } from '@shared/permissions';
import { hasPermission } from '@shared/permissions';
import { SessionService } from '../services/session.service';

export function merchantPermissionGuard(permission: AdminPermission): CanActivateFn {
  return (route) => {
    const session = inject(SessionService);
    const router = inject(Router);
    const user = session.user();
    const tenantSlug =
      route.parent?.paramMap.get('tenantSlug') ?? route.paramMap.get('tenantSlug') ?? user?.tenantSlug ?? '';

    if (!user?.tenantSlug || user.tenantSlug !== tenantSlug) {
      return router.createUrlTree(['/login']);
    }

    if (hasPermission(user.role, permission)) {
      return true;
    }

    return router.createUrlTree(['/', tenantSlug, 'admin', 'products']);
  };
}
