import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Combo, ComboCreacionDTO } from '../../core/models/combo.model'; // ⚠️ Ajusta la ruta

@Injectable({
  providedIn: 'root'
})
export class CombosService {
  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/combos';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todos los combos (El backend ya filtra por stock automáticamente)
  getCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(this.apiUrl);
  }

  // Obtener un combo por ID
  getComboById(id: number): Observable<Combo> {
    return this.http.get<Combo>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (JSON - Sin imágenes)
  // =========================================

  // Crear un nuevo combo (Solo datos)
  createCombo(comboData: ComboCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, comboData);
  }

  // Actualizar un combo existente (Solo datos)
  updateCombo(id: number, comboData: Partial<ComboCreacionDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, comboData);
  }

  // =========================================
  // 📷 ESCRITURA (FormData - Con imágenes)
  // =========================================

  // Crear con imágenes
  createComboFormData(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  // Actualizar con imágenes
  updateComboFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  // =========================================
  // 📕 ELIMINAR
  // =========================================

  deleteCombo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ==================================================
  // 🔄 MÉTODOS DE ESTADO (ACTIVAR / DESACTIVAR)
  // ==================================================

  // Cambiar estado manualmente
  cambiarEstadoCombo(id: number, estado: 'A' | 'I'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { Estado: estado });
  }

  activarCombo(id: number): Observable<any> {
    return this.cambiarEstadoCombo(id, 'A');
  }

  desactivarCombo(id: number): Observable<any> {
    return this.cambiarEstadoCombo(id, 'I');
  }

  // Alternar estado actual
  toggleEstadoCombo(id: number, estadoActual: 'A' | 'I'): Observable<any> {
    const nuevoEstado = estadoActual === 'A' ? 'I' : 'A';
    return this.cambiarEstadoCombo(id, nuevoEstado);
  }
}