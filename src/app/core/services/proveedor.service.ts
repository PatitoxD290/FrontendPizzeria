import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// ⚠️ Asegúrate de importar el DTO
import { Proveedor, ProveedorDTO } from '../../core/models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/proveedores';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todos los proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  // Obtener un proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear proveedor
  createProveedor(proveedor: ProveedorDTO): Observable<any> {
    return this.http.post(this.apiUrl, proveedor);
  }

  // Actualizar proveedor
  updateProveedor(id: number, proveedor: Partial<ProveedorDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, proveedor);
  }

  // =========================================
  // 📕 ELIMINAR / ESTADO
  // =========================================

  // Eliminar proveedor
  deleteProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Cambiar estado del proveedor (A=Activo, I=Inactivo)
  statusProveedor(id: number, estado: 'A' | 'I'): Observable<any> {
    // Nota: Estandaricé la ruta a '/status' para que coincida con los otros servicios
    return this.http.patch(`${this.apiUrl}/${id}/status`, { Estado: estado });
  }
}