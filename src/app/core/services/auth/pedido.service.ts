import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pedido,PedidoDetalle } from '../../models/pedido.model';
import { Observable } from 'rxjs';

export interface PedidoConDetalle extends Pedido {
  detalles?: PedidoDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private apiUrl = 'http://localhost:3000/api/v2/pedidos'; // ✅ corregido

  constructor(private http: HttpClient) {}

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  getPedidoDetalles(id: number): Observable<{ detalle: string }> {
    return this.http.get<{ detalle: string }>(`${this.apiUrl}/${id}`);
  }

  createPedido(pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = { ...pedidoConDetalle, detalles: pedidoConDetalle.detalles || [] };
    return this.http.post(this.apiUrl, payload);
  }

  updatePedido(id: number, pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = { ...pedidoConDetalle, detalles: pedidoConDetalle.detalles || [] };
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}