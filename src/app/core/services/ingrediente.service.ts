import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Insumo } from '../models/ingrediente.model';

@Injectable({
  providedIn: 'root'
})
export class IngredienteService {
  private apiUrl = 'http://localhost:3000/api/v2/Insumos';

  constructor(private http: HttpClient) {}

  // ✅ Obtener todos los ingredientes
  getIngredientes(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.apiUrl);
  }

  // ✅ Obtener un ingrediente por ID
  getIngredienteById(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.apiUrl}/${id}`);
  }

  // ✅ Crear nuevo ingrediente (sin enviar Estado)
  createIngrediente(ingrediente: Insumo): Observable<any> {
    // Remover el campo Estado antes de enviar
    const { Estado, ...ingredienteSinEstado } = ingrediente;
    return this.http.post(this.apiUrl, ingredienteSinEstado);
  }

  // ✅ Actualizar ingrediente existente (sin enviar Estado)
  updateIngrediente(id: number, ingrediente: Insumo): Observable<any> {
    // Remover el campo Estado antes de enviar
    const { Estado, ...ingredienteSinEstado } = ingrediente;
    return this.http.put(`${this.apiUrl}/${id}`, ingredienteSinEstado);
  }

  // ✅ Eliminar ingrediente
  deleteIngrediente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}