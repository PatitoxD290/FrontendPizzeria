// src/app/dashboard/services/categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaProducto, CategoriaInsumos } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrlProducto = 'http://localhost:3000/api/v2/categorias/producto';
  private apiUrlInsumos = 'http://localhost:3000/api/v2/categorias/insumos';

  constructor(private http: HttpClient) {}

  // =============================
  // 🟦 CATEGORÍAS PRODUCTO
  // =============================

  getCategoriasProducto(): Observable<CategoriaProducto[]> {
    return this.http.get<CategoriaProducto[]>(this.apiUrlProducto);
  }

  getCategoriaProductoById(id: number): Observable<CategoriaProducto> {
    return this.http.get<CategoriaProducto>(`${this.apiUrlProducto}/${id}`);
  }

  createCategoriaProducto(categoria: CategoriaProducto): Observable<any> {
    return this.http.post(this.apiUrlProducto, categoria);
  }

  updateCategoriaProducto(id: number, categoria: CategoriaProducto): Observable<any> {
    return this.http.put(`${this.apiUrlProducto}/${id}`, categoria);
  }

  deleteCategoriaProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlProducto}/${id}`);
  }

  // =============================
  // 🟨 CATEGORÍAS INSUMOS
  // =============================

  getCategoriasInsumos(): Observable<CategoriaInsumos[]> {
    return this.http.get<CategoriaInsumos[]>(this.apiUrlInsumos);
  }

  getCategoriaInsumoById(id: number): Observable<CategoriaInsumos> {
    return this.http.get<CategoriaInsumos>(`${this.apiUrlInsumos}/${id}`);
  }

  createCategoriaInsumo(categoria: CategoriaInsumos): Observable<any> {
    return this.http.post(this.apiUrlInsumos, categoria);
  }

  updateCategoriaInsumo(id: number, categoria: CategoriaInsumos): Observable<any> {
    return this.http.put(`${this.apiUrlInsumos}/${id}`, categoria);
  }

  deleteCategoriaInsumo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlInsumos}/${id}`);
  }
}
