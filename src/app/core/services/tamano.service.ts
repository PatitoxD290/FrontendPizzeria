// src/app/services/tamano.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tamano } from '../models/tamano.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TamanoService {

  private apiUrl = 'http://localhost:3000/api/v2/tamanos';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener todos los tamaños
  getTamanos(): Observable<Tamano[]> {
    return this.http.get<Tamano[]>(this.apiUrl);
  }

  // 🔹 Obtener un tamaño por ID
  getTamanoById(id: number): Observable<Tamano> {
    return this.http.get<Tamano>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear un nuevo tamaño
  createTamano(tamano: Partial<Tamano>): Observable<{ message: string; ID_Tamano: number }> {
    return this.http.post<{ message: string; ID_Tamano: number }>(this.apiUrl, tamano);
  }

  // 🔹 Actualizar un tamaño
  updateTamano(id: number, tamano: Partial<Tamano>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, tamano);
  }

  // 🔹 Eliminar un tamaño
  deleteTamano(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
