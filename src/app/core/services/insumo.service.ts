import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Insumo, 
  InsumoCreacionDTO, 
  InsumoUpdateDTO 
} from '../models/insumo.model'; // ⚠️ Ajusta la ruta a tu modelo

@Injectable({
  providedIn: 'root'
})
export class InsumoService {
  // Asegúrate de que coincida con tu backend (normalmente minúsculas)
  private apiUrl = 'http://localhost:3000/api/v2/insumos';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todos los insumos
  getInsumos(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.apiUrl);
  }

  // Obtener un insumo por ID
  getInsumoById(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear nuevo insumo (El DTO ya incluye campos de stock inicial y excluye lo que no se debe enviar)
  createInsumo(insumo: InsumoCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, insumo);
  }

  // Actualizar insumo existente
  updateInsumo(id: number, insumo: InsumoUpdateDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, insumo);
  }

  // Eliminar insumo
  deleteInsumo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}