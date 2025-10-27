// src/app/dashboard/services/delivery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Delivery } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = 'http://localhost:3000/api/v2/delivery'; 

  constructor(private http: HttpClient) {}

  // ===========================================
  // 🟩 MÉTODOS CRUD PRINCIPALES
  // ===========================================

  // 📘 Obtener todos los deliveries
  getDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.apiUrl);
  }

  // 📗 Obtener un delivery por ID
  getDeliveryById(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.apiUrl}/${id}`);
  }

  // 📙 Crear un nuevo delivery
  createDelivery(delivery: {
    id_pedido: number;
    direccion?: string;
    estado_d: 'E' | 'P' | 'C'; // En camino, Pendiente, Completado
  }): Observable<any> {
    return this.http.post(this.apiUrl, delivery);
  }

  // 📒 Actualizar un delivery (por ejemplo, cambiar estado o dirección)
  updateDelivery(id: number, delivery: Partial<Delivery>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, delivery);
  }

  // 📕 Eliminar un delivery
  deleteDelivery(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ===========================================
  // 🟦 FUNCIONALIDADES EXTRA (opcionales)
  // ===========================================

  // 📍 Obtener deliveries por estado
  getDeliveriesPorEstado(estado: 'E' | 'P' | 'C'): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}?estado=${estado}`);
  }

  // 🚚 Cambiar estado de un delivery rápidamente
  actualizarEstado(id: number, nuevoEstado: 'E' | 'P' | 'C'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado_d: nuevoEstado });
  }
}
