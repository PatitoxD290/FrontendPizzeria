import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// ⚠️ Asegúrate que esta ruta sea correcta en tu proyecto
import { Producto, ProductoCreacionDTO } from '../../core/models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Ajusta el puerto si tu backend corre en otro (ej: 4000)
  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/productos'; 

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  /** Obtener todos los productos (incluye tamaños e imágenes) */
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  /** Obtener un producto por ID */
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (JSON)
  // =========================================

  /** * Crear producto enviando JSON puro.
   * Útil si NO estás subiendo imágenes en este paso.
   */
  createProducto(producto: ProductoCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, producto);
  }

  /** * Actualizar producto enviando JSON puro.
   * Usamos Partial para permitir enviar solo algunos campos.
   */
  updateProducto(id: number, producto: Partial<ProductoCreacionDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto);
  }

  // =========================================
  // 📷 ESCRITURA (FormData - Imágenes)
  // =========================================

  /**
   * Crear producto con imagen.
   * ⚠️ El componente debe armar el FormData.
   * Recuerda: El array de tamaños debe ir como string JSON dentro del FormData.
   */
  createProductoFormData(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  /**
   * Actualizar producto con imagen.
   */
  updateProductoFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  // =========================================
  // 📕 ELIMINAR
  // =========================================

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}