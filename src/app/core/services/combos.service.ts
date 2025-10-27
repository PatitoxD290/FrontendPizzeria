import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Combo } from '../models/combo.model';

@Injectable({
  providedIn: 'root'
})
export class CombosService {
  private apiUrl = 'http://localhost:3000/api/v2/combos'; // Ruta base del backend

  constructor(private http: HttpClient) {}

  /** 🔹 Obtener todos los combos */
  getCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(this.apiUrl);
  }

  /** 🔹 Obtener un combo por ID */
  getComboById(id: number): Observable<Combo> {
    return this.http.get<Combo>(`${this.apiUrl}/${id}`);
  }

  /** 🔹 Crear un combo con sus detalles */
  createCombo(combo: Combo): Observable<any> {
    return this.http.post(`${this.apiUrl}`, combo);
  }

  /** 🔹 Actualizar un combo existente */
  updateCombo(id: number, combo: Combo): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, combo);
  }

  /** 🔹 Eliminar un combo */
  deleteCombo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
