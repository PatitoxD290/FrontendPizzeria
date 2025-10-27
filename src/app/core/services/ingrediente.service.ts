// src/app/dashboard/services/ingrediente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Insumo } from '../models/ingrediente.model';

@Injectable({
  providedIn: 'root'
})
export class IngredienteService {
  private apiUrl = 'http://localhost:3000/api/v2/Insumos'; // Ajusta el puerto si tu backend usa otro

  constructor(private http: HttpClient) {}

  // ✅ Obtener todos los ingredientes
  getIngredientes(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.apiUrl);
  }

  // ✅ Obtener un ingrediente por ID
  getIngredienteById(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.apiUrl}/${id}`);
  }

  // ✅ Crear nuevo ingrediente
  createIngrediente(ingrediente: Insumo): Observable<any> {
    return this.http.post(this.apiUrl, ingrediente);
  }

  // ✅ Actualizar ingrediente existente
  updateIngrediente(id: number, ingrediente: Insumo): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, ingrediente);
  }

  // ✅ Eliminar ingrediente
  deleteIngrediente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
