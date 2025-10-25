import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  if (!token) {
    router.navigate(['/dashboard/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expired = Date.now() >= payload.exp * 1000;

    if (expired) {
      auth.logout();
      router.navigate(['/dashboard/login']);
      return false;
    }
  } catch {
    auth.logout();
    router.navigate(['/dashboard/login']);
    return false;
  }

  return true;
};
