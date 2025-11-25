import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2';

  // 🔹 Signals para manejar token y usuario
  token = signal<string | null>(localStorage.getItem('token'));
  user = signal<any | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  constructor(private http: HttpClient, private router: Router) {

    // ✅ Sincronizar login/logout entre pestañas SOLO SI ESTAMOS EN DASHBOARD
    window.addEventListener('storage', (event) => {
      const isDashboardRoute = this.router.url.startsWith('/dashboard');
      
      if (!isDashboardRoute) return; // ⛔ No hacer nada si estamos en kiosko
      
      if (event.key === 'logout') this.handleMultiTabLogout();
      if (event.key === 'login') this.handleMultiTabLogin();
    });

    // ✅ Validar token al iniciar SOLO si estamos en dashboard
    const savedToken = localStorage.getItem('token');
    if (savedToken) this.validateToken(savedToken);

    // 🔁 Verificar automáticamente cada 10s si el token sigue válido
    // SOLO si estamos en rutas del dashboard
    setInterval(() => {
      const isDashboardRoute = this.router.url.startsWith('/dashboard');
      
      if (!isDashboardRoute) return; // ⛔ No validar en kiosko
      
      const token = this.getToken();
      if (token) this.validateToken(token);
    }, 10000); // 10 segundos
  }

  // 🔹 LOGIN
  login(Correo: string, Password: string) {
    return this.http.post<{ token: string, user: any }>(
      `${this.apiUrl}/login`,
      { Correo, Password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.token.set(res.token);
        this.user.set(res.user);
        this.router.navigate(['/dashboard/home']);
      })
    );
  }

  // 🔹 LOGOUT
  logout() {
    // ⛔ Solo hacer logout si estamos en dashboard
    const isDashboardRoute = this.router.url.startsWith('/dashboard');
    
    if (!isDashboardRoute) return;

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
    // ⛔ No validar si estamos en kiosko
    const isDashboardRoute = this.router.url.startsWith('/dashboard');
    if (!isDashboardRoute) return;

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