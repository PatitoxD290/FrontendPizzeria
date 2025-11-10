import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 🔹 VERIFICAR SI ESTAMOS INTENTANDO ACCEDER AL DASHBOARD
  const isDashboardRoute = state.url.startsWith('/dashboard');
  
  // ⛔ Si no es ruta de dashboard, permitir acceso (kiosko es público)
  if (!isDashboardRoute) {
    return true;
  }

  // 🔹 Si es dashboard/login, permitir acceso directo
  if (state.url === '/dashboard/login') {
    return true;
  }

  const token = auth.getToken();

  // 🔹 Si no hay token, redirige al login del dashboard
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