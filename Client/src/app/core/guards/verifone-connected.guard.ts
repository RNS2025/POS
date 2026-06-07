import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SetupService } from '../services/setup.service';
import { map, catchError, of } from 'rxjs';

export const verifoneConnectedGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const setup = inject(SetupService);
  const tenantSlug = route.paramMap.get('tenantSlug') ?? '';

  return setup.getSetup(tenantSlug).pipe(
    map((s) => {
      if (s.verifoneConnected) {
        return true;
      }
      return router.createUrlTree(['/', tenantSlug, 'admin', 'setup']);
    }),
    catchError(() => of(router.createUrlTree(['/', tenantSlug, 'admin', 'setup']))),
  );
};
