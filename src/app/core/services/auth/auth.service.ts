import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/v2';

  token = signal<string | null>(localStorage.getItem('token'));
  user = signal<any | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  constructor(private http: HttpClient, private router: Router) {

    // ✅ Sincronizar login/logout entre pestañas
    window.addEventListener('storage', (event) => {
      if (event.key === 'logout') this.handleMultiTabLogout();
      if (event.key === 'login') this.handleMultiTabLogin();
    });

    const savedToken = localStorage.getItem('token');
    if (savedToken) this.validateToken(savedToken);
  }

  login(dni: string, password: string) {
    return this.http.post<{ token: string, user: any }>(
      `${this.apiUrl}/login`,
      { dni, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('login', Date.now().toString()); // 🔔 Notifica LOGIN a otras pestañas ✅

        this.token.set(res.token);
        this.user.set(res.user);

        this.router.navigate(['/dashboard/home']);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('logout', Date.now().toString()); // 🔔 Notifica LOGOUT ✅

    this.token.set(null);
    this.user.set(null);

    this.router.navigate(['/dashboard/login']);
  }

  // ✅ Cuando otra pestaña hace login
  private handleMultiTabLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token) {
      this.token.set(token);
      this.user.set(user ? JSON.parse(user) : null);
      this.router.navigate(['/dashboard/home']);
    }
  }

  // ✅ Cuando otra pestaña hace logout
  private handleMultiTabLogout() {
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/dashboard/login']);
  }

  private validateToken(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = Date.now() >= payload.exp * 1000;
      if (expired) this.logout();
    } catch {
      this.logout();
    }
  }

  // Helpers
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
}
