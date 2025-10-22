import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PrecioProducto } from '../../core/models/precio-producto.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrecioProductoService {

  private apiUrl = 'http://localhost:3000/api/v2/precioproductos';

  constructor(private http: HttpClient) { }

  // Obtener todos los precios
  getPreciosProducto(): Observable<PrecioProducto[]> {
    return this.http.get<PrecioProducto[]>(this.apiUrl);
  }

  // Obtener un precio por ID
  getPrecioProductoById(id: number): Observable<PrecioProducto> {
    return this.http.get<PrecioProducto>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo precio de producto
  createPrecioProducto(precioProducto: PrecioProducto): Observable<any> {
    return this.http.post(this.apiUrl, precioProducto);
  }

  // Actualizar precio de producto
  updatePrecioProducto(id: number, precioProducto: PrecioProducto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, precioProducto);
  }

  // Eliminar precio de producto
  deletePrecioProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
