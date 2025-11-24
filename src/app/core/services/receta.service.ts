import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// ⚠️ Asegúrate de importar el DTO
import { Receta, RecetaDetalle, RecetaCreacionDTO } from '../../core/models/receta.model';

// Interfaz específica para la respuesta del backend que trae todo junto
export interface RecetaCompletaResponse {
  receta: Receta;
  detalles: RecetaDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  // Ajusta la URL base para apuntar al recurso recetas
  private apiUrl = 'http://localhost:3000/api/v2/recetas'; 
  // URL auxiliar para detalles sueltos (si el backend lo separó)
  private apiUrlDetalles = 'http://localhost:3000/api/v2/detalle-receta';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todas las recetas (Solo cabeceras)
  getRecetas(): Observable<Receta[]> {
    return this.http.get<Receta[]>(this.apiUrl);
  }

  // Obtener una receta específica con sus detalles
  // El backend devuelve un objeto { receta: {...}, detalles: [...] }
  getRecetaCompleta(id: number): Observable<RecetaCompletaResponse> {
    return this.http.get<RecetaCompletaResponse>(`${this.apiUrl}/${id}`);
  }

  // Obtener SOLO los detalles (ingredientes) de una receta
  getDetallesPorReceta(recetaId: number): Observable<RecetaDetalle[]> {
    // Asegúrate que esta ruta coincida con tu backend (recetas.controller.js > getDetallesPorReceta)
    // En el backend que hicimos era: /api/v2/recetas/:id/detalles o similar.
    // Si usaste la ruta separada:
    return this.http.get<RecetaDetalle[]>(`${this.apiUrlDetalles}/por-receta/${recetaId}`);
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear receta (El DTO asegura que Tiempo_Preparacion sea number)
  createReceta(recetaData: RecetaCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, recetaData);
  }

  // Actualizar receta
  updateReceta(id: number, recetaData: Partial<RecetaCreacionDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, recetaData);
  }

  // =========================================
  // 📕 ELIMINAR
  // =========================================

  deleteReceta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}