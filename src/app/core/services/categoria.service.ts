import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CategoriaProducto, 
  CategoriaProductoDTO, 
  CategoriaInsumos, 
  CategoriaInsumoDTO 
} from '../../core/models/categoria.model'; // ⚠️ Ajusta la ruta según tu estructura de carpetas

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  // Asegúrate de que este puerto coincida con tu backend
  private apiUrlBase = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/categorias';

  constructor(private http: HttpClient) {}

  // =================================================
  // 🟦 CATEGORÍAS PRODUCTO
  // =================================================

  getCategoriasProducto(): Observable<CategoriaProducto[]> {
    return this.http.get<CategoriaProducto[]>(`${this.apiUrlBase}/producto`);
  }

  getCategoriaProductoById(id: number): Observable<CategoriaProducto> {
    return this.http.get<CategoriaProducto>(`${this.apiUrlBase}/producto/${id}`);
  }

  // 🟢 Usa DTO para crear (solo enviamos Nombre)
  createCategoriaProducto(categoria: CategoriaProductoDTO): Observable<any> {
    return this.http.post(`${this.apiUrlBase}/producto`, categoria);
  }

  // 🟠 Usa DTO para actualizar
  updateCategoriaProducto(id: number, categoria: CategoriaProductoDTO): Observable<any> {
    return this.http.put(`${this.apiUrlBase}/producto/${id}`, categoria);
  }

  deleteCategoriaProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlBase}/producto/${id}`);
  }

  // =================================================
  // 🟨 CATEGORÍAS INSUMOS
  // =================================================

  getCategoriasInsumos(): Observable<CategoriaInsumos[]> {
    // Nota: El backend acepta "insumo" o "insumos", mantengo tu URL
    return this.http.get<CategoriaInsumos[]>(`${this.apiUrlBase}/insumos`);
  }

  getCategoriaInsumoById(id: number): Observable<CategoriaInsumos> {
    return this.http.get<CategoriaInsumos>(`${this.apiUrlBase}/insumos/${id}`);
  }

  // 🟢 Usa DTO para crear
  createCategoriaInsumo(categoria: CategoriaInsumoDTO): Observable<any> {
    return this.http.post(`${this.apiUrlBase}/insumos`, categoria);
  }

  // 🟠 Usa DTO para actualizar
  updateCategoriaInsumo(id: number, categoria: CategoriaInsumoDTO): Observable<any> {
    return this.http.put(`${this.apiUrlBase}/insumos/${id}`, categoria);
  }

  deleteCategoriaInsumo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlBase}/insumos/${id}`);
  }
}