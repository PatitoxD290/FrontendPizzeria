import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Combo, ComboDetalle } from '../models/combo.model';

// Interface para crear/actualizar combos con detalles
interface ComboConDetalles extends Combo {
  detalles: Array<{
    ID_Producto_T: number;
    Cantidad: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CombosService {
  private apiUrl = 'http://localhost:3000/api/v2/combos';

  constructor(private http: HttpClient) {}

  // Obtener todos los combos
  getCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(this.apiUrl);
  }

  // Obtener un combo por ID
  getComboById(id: number): Observable<Combo> {
    return this.http.get<Combo>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo combo (JSON) - CORREGIDO
  createCombo(comboData: ComboConDetalles): Observable<any> {
    return this.http.post(this.apiUrl, comboData);
  }

  // Actualizar un combo existente (JSON) - CORREGIDO
  updateCombo(id: number, comboData: Partial<ComboConDetalles>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, comboData);
  }

  // Eliminar un combo
  deleteCombo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo combo con FormData (para subir imágenes)
  createComboFormData(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  // Actualizar un combo existente con FormData (para subir imágenes)
  updateComboFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }
}