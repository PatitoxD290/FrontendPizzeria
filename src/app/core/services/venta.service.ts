import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// 🟢 CORREGIDO: Importa Venta y el nuevo VentaCreacionDTO
import { Venta, VentaCreacionDTO } from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'http://localhost:3000/api/v2/ventas'; 
  constructor(private http: HttpClient) {}

  // 📘 Obtener todas las ventas
  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  // 📗 Obtener una venta por ID (incluye productos)
  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  // 📙 Crear una nueva venta
  // 🟢 CORREGIDO: El parámetro ahora usa el DTO correcto (PascalCase)
  createVenta(ventaData: VentaCreacionDTO): Observable<any> {
    // ventaData ya tiene el formato { ID_Pedido: ... } que el backend espera
    return this.http.post(this.apiUrl, ventaData);
  }

  // 📒 Actualizar venta existente
  updateVenta(id: number, venta: Partial<Venta>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, venta);
  }

  // 📕 Eliminar una venta
  deleteVenta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 📗 Obtener ventas por fecha o rango
  getVentasPorFecha(fechaInicio: string, fechaFin: string): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  // 📊 Obtener resumen o reporte de ventas
  getResumenVentas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumen`);
  }
}
