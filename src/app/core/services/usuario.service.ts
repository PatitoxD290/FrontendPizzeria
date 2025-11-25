import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// ⚠️ Asegúrate de importar el DTO
import { Usuario, UsuarioDTO } from '../../core/models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/usuarios';

  constructor(private http: HttpClient) {}

  // Helper para obtener el token (Si no usas Interceptor)
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // O sessionStorage
    return new HttpHeaders({
      // 'Content-Type': 'application/json', // Angular lo pone automático
      'Authorization': `Bearer ${token}`
    });
  }

  // =========================================
  // 📘 LECTURA
  // =========================================

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear usuario (Requiere password en el DTO)
  createUsuario(usuario: UsuarioDTO): Observable<any> {
    return this.http.post(this.apiUrl, usuario, { headers: this.getHeaders() });
  }

  // Actualizar usuario (Password es opcional en Partial<DTO>)
  updateUsuario(id: number, usuario: Partial<UsuarioDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, usuario, { headers: this.getHeaders() });
  }

  // =========================================
  // 🔐 SEGURIDAD Y ESTADO
  // =========================================

  // Eliminar usuario
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Cambiar contraseña (Endpoint específico)
  changePassword(id: number, password: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/password`, { password }, { headers: this.getHeaders() });
  }

  // Cambiar estado (Activo <-> Inactivo)
  // Se puede enviar el estado deseado o dejar vacío para toggle
  statusUsuario(id: number, estado?: 'A' | 'I'): Observable<any> {
    const body = estado ? { Estado: estado } : {};
    return this.http.put(`${this.apiUrl}/${id}/status`, body, { headers: this.getHeaders() });
  }
}