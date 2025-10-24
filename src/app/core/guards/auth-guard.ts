import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  if (!token) {
    return redirectToLogin(router);
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;

    if (isExpired) {
      auth.logout();
      return redirectToLogin(router);
    }

  } catch {
    auth.logout();
    return redirectToLogin(router);
  }

  return true;
};

// ✅ Dashboard es lo único protegido
function redirectToLogin(router: Router) {
  router.navigate(['/dashboard/login']);
  return false;
}
