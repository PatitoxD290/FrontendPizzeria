// src/app/dashboard/services/receta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receta } from '../../core/models/receta.model';
import { DetalleReceta } from '../../core/models/detalle-receta.model';

@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  private apiUrl = 'http://localhost:3000/api/v2'; // 👈 cambia a nivel raíz

  constructor(private http: HttpClient) {}

  // 📘 Obtener todas las recetas
  getRecetas(): Observable<Receta[]> {
    return this.http.get<Receta[]>(`${this.apiUrl}/recetas`);
  }

  // 📗 Obtener receta con detalles
  getRecetaDetalle(id: number): Observable<{ receta: Receta, detalles: string }> {
    return this.http.get<{ receta: Receta, detalles: string }>(`${this.apiUrl}/recetas/${id}`);
  }

  // 📗 Crear receta con detalles
  createRecetaConDetalle(data: { 
    nombre_receta: string, 
    descripcion_receta: string, 
    tiempo_estimado_minutos?: number, 
    detalles: DetalleReceta[] 
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/recetas`, data);
  }

  // 📙 Actualizar receta (y/o sus detalles)
  updateReceta(id: number, data: { 
    nombre_receta?: string, 
    descripcion_receta?: string, 
    tiempo_estimado_minutos?: number, 
    detalles?: DetalleReceta[] 
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/recetas/${id}`, data);
  }

  // 📕 Eliminar receta (y sus detalles)
  deleteReceta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recetas/${id}`);
  }

  // 📗 Obtener detalles de una receta específica
  getDetallesPorReceta(recetaId: number): Observable<DetalleReceta[]> {
    return this.http.get<DetalleReceta[]>(`${this.apiUrl}/detalle-receta/por-receta/${recetaId}`);
  }
}
