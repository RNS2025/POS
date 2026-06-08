import { Router } from '@angular/router';
import type { AuthUser } from '@shared/auth';

export function navigateAfterMerchantLogin(router: Router, user: AuthUser): void {
  if (!user.tenantSlug) {
    void router.navigate(['/platform', 'merchants']);
    return;
  }
  if (user.mustChangePassword) {
    void router.navigate(['/', user.tenantSlug, 'admin', 'change-password']);
    return;
  }
  void router.navigate(['/', user.tenantSlug, 'admin', 'products']);
}
