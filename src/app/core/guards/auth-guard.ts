import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // 🔹 Si no hay token, redirige al login
  if (!token) {
    return redirectToLogin(router, auth);
  }

  // 🔹 Verificar validez del token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;

    if (isExpired) {
      console.warn('Token expirado');
      return redirectToLogin(router, auth);
    }
  } catch {
    console.error('Token inválido');
    return redirectToLogin(router, auth);
  }

  return true;
};

// 🔁 Función auxiliar para limpiar sesión y redirigir
function redirectToLogin(router: Router, auth: AuthService) {
  auth.logout(); // elimina token y usuario
  router.navigate(['/dashboard/login']);
  return false;
}
