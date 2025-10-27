import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tamanopizza } from '../../core/models/tamanopizza.model';

@Injectable({
  providedIn: 'root'
})
export class TamanopizzaService {

  private baseUrl = 'http://localhost:3001/api/v2/tamanopizza';

  constructor(private http: HttpClient) { }

  // Obtener todos los tamaños de pizza
  getTamanos(): Observable<Tamanopizza[]> {
    return this.http.get<Tamanopizza[]>(this.baseUrl);
  }

  // Obtener un tamaño por ID
  getTamanoById(id: number): Observable<Tamanopizza> {
    return this.http.get<Tamanopizza>(`${this.baseUrl}/${id}`);
  }

  // Crear un nuevo tamaño
  createTamano(data: Partial<Tamanopizza>): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // Actualizar un tamaño existente
  updateTamano(id: number, data: Partial<Tamanopizza>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // Eliminar un tamaño
  deleteTamano(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
