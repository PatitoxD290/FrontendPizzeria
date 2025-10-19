import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/v2'; // URL de tu backend

  token = signal<string | null>(localStorage.getItem('token'));
  user = signal<any | null>(null); // para guardar los datos del usuario

  constructor(private http: HttpClient) {
    // Verificar y cargar token
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const expired = Date.now() >= payload.exp * 1000;

        if (expired) {
          this.logout();
        } else {
          this.token.set(savedToken);

          if (savedUser) {
            this.user.set(JSON.parse(savedUser));
          }
        }
      } catch {
        this.logout();
      }
    }
  }

  // Login
  login(dni: string, password: string) {
    return this.http.post<{ token: string, user: any }>(`${this.apiUrl}/login`, { dni, password })
      .pipe(
        tap(res => {
          // Guardar token
          localStorage.setItem('token', res.token);
          this.token.set(res.token);

          // Guardar usuario
          localStorage.setItem('user', JSON.stringify(res.user));
          this.user.set(res.user);
        })
      );
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.user.set(null);
  }

  // Saber si está logueado
  isLoggedIn(): boolean {
    return !!this.token();
  }

  // Obtener token
  getToken(): string | null {
    return this.token();
  }

  // Obtener usuario completo
  getUser(): any | null {
    return this.user();
  }

  // Obtener datos individuales del usuario
  getUserId(): number | null {
    return this.user()?.id ?? null;
  }

  getUserNombre(): string | null {
    return this.user()?.nombre ?? null;
  }

  getUserDni(): string | null {
    return this.user()?.dni ?? null;
  }

  getUserRol(): string | null {
    return this.user()?.rol ?? null;
  }
}
