// src/app/dashboard/services/pedido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoDetalle } from '../models/pedido.model';

export interface PedidoConDetalle extends Pedido {
  detalles?: PedidoDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private apiUrl = 'http://localhost:3000/api/v2/pedidos';

  constructor(private http: HttpClient) {}

  // =============================
  // 🟦 PEDIDOS
  // =============================

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  getPedidoById(id: number): Observable<PedidoConDetalle> {
    return this.http.get<PedidoConDetalle>(`${this.apiUrl}/${id}`);
  }

  createPedido(pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = {
      ...pedidoConDetalle,
      detalles: pedidoConDetalle.detalles || []
    };
    return this.http.post(this.apiUrl, payload);
  }

  updatePedido(id: number, pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = {
      ...pedidoConDetalle,
      detalles: pedidoConDetalle.detalles || []
    };
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =============================
  // 🟨 DETALLES DEL PEDIDO
  // =============================

  getPedidoDetalles(id: number): Observable<PedidoDetalle[]> {
    return this.http.get<PedidoDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  getDetallesConNotas(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/notas`);
  }

  // =============================
  // 🟧 CAMBIAR ESTADO DEL PEDIDO
  // =============================
  statusPedido(id: number, estado: 'P' | 'E' | 'C'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { Estado_P: estado });
  }
}
