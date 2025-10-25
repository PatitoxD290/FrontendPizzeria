// src/app/dashboard/services/proveedor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../../core/models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'http://localhost:3000/api/v2/proveedores'; // Ajusta el puerto si tu backend usa otro

  constructor(private http: HttpClient) {}

  // Obtener todos los proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  // Obtener un proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // Crear proveedor
  createProveedor(proveedor: Proveedor): Observable<any> {
    return this.http.post(this.apiUrl, proveedor);
  }

  // Actualizar proveedor
  updateProveedor(id: number, proveedor: Proveedor): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, proveedor);
  }

  // Eliminar proveedor
  deleteProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
