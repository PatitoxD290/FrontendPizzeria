import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/v2';

  // 🔹 Signals para manejar token y usuario
  token = signal<string | null>(localStorage.getItem('token'));
  user = signal<any | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  constructor(private http: HttpClient, private router: Router) {

    // ✅ Sincronizar login/logout entre pestañas
    window.addEventListener('storage', (event) => {
      if (event.key === 'logout') this.handleMultiTabLogout();
      if (event.key === 'login') this.handleMultiTabLogin();
    });

    // ✅ Validar token al iniciar la app
    const savedToken = localStorage.getItem('token');
    if (savedToken) this.validateToken(savedToken);

    // 🔁 Verificar automáticamente cada 10 s si el token sigue válido
    setInterval(() => {
      const token = this.getToken();
      if (token) this.validateToken(token);
    }, 10000); // 10 segundos
  }

  // 🔹 LOGIN
  login(dni: string, password: string) {
    return this.http.post<{ token: string, user: any }>(
      `${this.apiUrl}/login`,
      { dni, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('login', Date.now().toString()); // 🔔 Notifica login entre pestañas

        this.token.set(res.token);
        this.user.set(res.user);

        this.router.navigate(['/dashboard/home']);
      })
    );
  }

  // 🔹 LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('logout', Date.now().toString()); 

    this.token.set(null);
    this.user.set(null);

    // 🔁 Redirigir al login
    this.router.navigate(['/dashboard/login']);
  }

  // ✅ Sincronizar cuando otra pestaña hace LOGIN
  private handleMultiTabLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token) {
      this.token.set(token);
      this.user.set(user ? JSON.parse(user) : null);
      this.router.navigate(['/dashboard/home']);
    }
  }

  // ✅ Sincronizar cuando otra pestaña hace LOGOUT
  private handleMultiTabLogout() {
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/dashboard/login']);
  }

  // 🔹 Validar si el token sigue siendo válido
private validateToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expired = Date.now() >= payload.exp * 1000;

    if (expired) {
      console.warn('🔒 Token expirado. Cerrando sesión...');
      import('sweetalert2').then(({ default: Swal }) => {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
        }).then(() => this.logout());
      });
    }
  } catch {
    console.error('⚠️ Token inválido. Cerrando sesión...');
    this.logout();
  }
}


  // 🔹 Métodos auxiliares (helpers)
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any | null {
    return this.user();
  }

  getUserRol(): string | null {
    return this.user()?.rol ?? null;
  }
  getnombreUsuario(): string | null {
    return this.user()?.nombre ?? null;
  }
}
