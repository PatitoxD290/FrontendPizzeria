import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pedido } from '../../core/models/pedido.model';
import { DetallePedido } from '../../core/models/detalle-pedido.model';
import { Observable } from 'rxjs';

// Hacemos que detalles sea opcional para mayor flexibilidad
export interface PedidoConDetalle extends Pedido {
  detalles?: DetallePedido[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private apiUrl = 'http://localhost:3000/api/v2/pedidos';

  constructor(private http: HttpClient) { }

  // Obtener todos los pedidos
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  // Obtener detalles concatenados de un pedido
  getPedidoDetalles(id: number): Observable<{ detalle: string }> {
    return this.http.get<{ detalle: string }>(`${this.apiUrl}/${id}`);
  }

  // Crear pedido con detalles
  createPedido(pedidoConDetalle: PedidoConDetalle): Observable<any> {
    // Garantizamos que 'detalles' siempre exista
    const payload = { ...pedidoConDetalle, detalles: pedidoConDetalle.detalles || [] };
    return this.http.post(this.apiUrl, payload);
  }

  // Actualizar pedido con detalles
  updatePedido(id: number, pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = { ...pedidoConDetalle, detalles: pedidoConDetalle.detalles || [] };
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  // Eliminar pedido (solo cabecera, no detalles)
  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}