// src/app/dashboard/services/receta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receta } from '../../core/models/receta.model';

@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  private apiUrl = 'http://localhost:3000/api/v2/recetas'; // ajusta el puerto según tu backend

  constructor(private http: HttpClient) {}

  // Obtener todas las recetas
  getRecetas(): Observable<Receta[]> {
    return this.http.get<Receta[]>(this.apiUrl);
  }

  // Obtener una receta por ID
  getRecetaById(id: number): Observable<Receta> {
    return this.http.get<Receta>(`${this.apiUrl}/${id}`);
  }

  // Crear una receta
  createReceta(receta: Receta): Observable<any> {
    return this.http.post(this.apiUrl, receta);
  }

  // Actualizar una receta
  updateReceta(id: number, receta: Receta): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, receta);
  }

  // Eliminar una receta
  deleteReceta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
