import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// ⚠️ Asegúrate de la ruta correcta
import { Tamano, TamanoDTO } from '../../core/models/tamano.model';

@Injectable({
  providedIn: 'root'
})
export class TamanoService {

  private apiUrl = 'http://localhost:3000/api/v2/tamanos';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todos los tamaños
  getTamanos(): Observable<Tamano[]> {
    return this.http.get<Tamano[]>(this.apiUrl);
  }

  // Obtener un tamaño por ID
  getTamanoById(id: number): Observable<Tamano> {
    return this.http.get<Tamano>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear un nuevo tamaño
  createTamano(tamano: TamanoDTO): Observable<any> {
    return this.http.post(this.apiUrl, tamano);
  }

  // Actualizar un tamaño (Partial permite enviar solo el campo modificado si hubiera más)
  updateTamano(id: number, tamano: Partial<TamanoDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, tamano);
  }

  // =========================================
  // 📕 ELIMINAR
  // =========================================

  deleteTamano(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}