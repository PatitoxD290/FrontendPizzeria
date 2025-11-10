// src/app/core/interceptors/auth-interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  // 🔹 VERIFICAR SI ESTAMOS EN RUTAS DEL KIOSKO
  const currentUrl = router.url;
  const isKioskoRoute = currentUrl.startsWith('/kiosko');

  // 👉 Solo agregar token si NO estamos en kiosko
  const clonedReq = token && !isKioskoRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ⚠️ Solo manejar errores 401 si estamos en dashboard
      if (error.status === 401 && !isKioskoRoute) {
        const msg =
          error.error?.error?.includes('expirado') ||
          error.error?.message?.includes('expirado')
            ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
            : 'Tu sesión no es válida. Inicia sesión de nuevo.';

        Swal.fire({
          icon: 'warning',
          title: 'Sesión finalizada',
          text: msg,
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
        }).then(() => {
          auth.logout();
          router.navigate(['/dashboard/login']);
        });
      }

      return throwError(() => error);
    })
  );
};