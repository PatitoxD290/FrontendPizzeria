import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  if (!token) {
    return redirectToLogin(router, auth);
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;

    if (isExpired) {
      auth.logout();
      return redirectToLogin(router, auth);
    }
  } catch {
    auth.logout();
    return redirectToLogin(router, auth);
  }

  return true;
};

// 🔁 Función auxiliar
function redirectToLogin(router: Router, auth: AuthService) {
  // Limpia datos y redirige
  auth.logout();
  router.navigate(['/dashboard/login']);
  return false;
}
