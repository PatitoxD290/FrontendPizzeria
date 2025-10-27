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

  // 👉 Agregar token si existe
  const clonedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ⚠️ Si el backend responde con token expirado o inválido
      if (error.status === 401) {
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
