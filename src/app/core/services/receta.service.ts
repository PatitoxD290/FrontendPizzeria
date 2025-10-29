// src/app/dashboard/services/receta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receta, RecetaDetalle} from '../models/receta.model';


@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  private apiUrl = 'http://localhost:3000/api/v2'; // raíz de la API

  constructor(private http: HttpClient) {}

  // 📘 Obtener todas las recetas
  getRecetas(): Observable<Receta[]> {
    return this.http.get<Receta[]>(`${this.apiUrl}/recetas`);
  }

  // 📗 Obtener receta con sus detalles
  getRecetaDetalle(id: number): Observable<{ receta: Receta, detalles: RecetaDetalle[] }> {
    return this.http.get<{ receta: Receta, detalles: RecetaDetalle[] }>(`${this.apiUrl}/recetas/${id}`);
  }

  // 📗 Crear receta con detalles
  createRecetaConDetalle(data: {
    Nombre: string;
    Descripcion?: string;
<<<<<<< HEAD
    Tiempo_Preparacion?: string;
    Detalles: RecetaDetalle[];
=======
    Tiempo_preparacion?: string;
    detalles: RecetaDetalle[];
>>>>>>> abner
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/recetas`, data);
  }

  // 📙 Actualizar receta (y/o sus detalles)
  updateReceta(id: number, data: {
    Nombre?: string;
    Descripcion?: string;
<<<<<<< HEAD
    Tiempo_Preparacion?: string;
    Detalles?: RecetaDetalle[];
=======
    Tiempo_preparacion?: string;
    detalles?: RecetaDetalle[];
>>>>>>> abner
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/recetas/${id}`, data);
  }

  // 📕 Eliminar receta (y sus detalles)
  deleteReceta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recetas/${id}`);
  }

  // 📒 Obtener los detalles de una receta específica
  getDetallesPorReceta(recetaId: number): Observable<RecetaDetalle[]> {
    return this.http.get<RecetaDetalle[]>(`${this.apiUrl}/detalle-receta/por-receta/${recetaId}`);
  }
}
