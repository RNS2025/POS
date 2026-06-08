import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KasseSessionService } from '../../features/kasse/services/kasse-session.service';
import { SessionService } from '../services/session.service';

function isKasseRegisterApi(url: string): boolean {
  return /\/api\/v1\/tenants\/[^/]+\/kasse\/[^/]+\/(catalog|sales|pay\/qr|orders|receipt)/.test(url);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const kasseToken = inject(KasseSessionService).token();
  const adminToken = inject(SessionService).token();
  const token = isKasseRegisterApi(req.url) && kasseToken ? kasseToken : adminToken;

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
