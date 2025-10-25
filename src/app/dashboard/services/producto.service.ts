// src/app/dashboard/services/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../../core/models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/v2/productos'; // ajusta el puerto según tu backend

  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // Obtener un producto por ID
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo producto (JSON)
  createProducto(producto: Producto): Observable<any> {
    return this.http.post(this.apiUrl, producto);
  }

  // Actualizar un producto existente (JSON)
  updateProducto(id: number, producto: Producto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto);
  }

  // Eliminar un producto
  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ----------------------------
  // NUEVOS MÉTODOS: manejar FormData (imagen + campos)
  // ----------------------------
  /**
   * Crear producto enviando FormData (multipart/form-data).
   * Ej: formData.append('imagen', file); formData.append('nombre_producto', 'Pizza');
   */
  createProductoFormData(formData: FormData): Observable<any> {
    // NO seteamos headers Content-Type: el navegador lo hará automáticamente.
    return this.http.post(this.apiUrl, formData);
  }

  /**
   * Actualizar producto enviando FormData (multipart/form-data).
   * Ej: PUT /productos/:id
   */
  updateProductoFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }
}
