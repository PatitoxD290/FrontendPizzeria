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

  private apiUrl = 'http://localhost:3000/api/v2/pedidos'; // Ajusta si tu backend usa otro puerto o ruta

  constructor(private http: HttpClient) {}

  // ✅ Obtener todos los pedidos
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  // ✅ Obtener un pedido por ID (con o sin detalles)
  getPedidoById(id: number): Observable<PedidoConDetalle> {
    return this.http.get<PedidoConDetalle>(`${this.apiUrl}/${id}`);
  }

  // ✅ Obtener los detalles de un pedido específico
  getPedidoDetalles(id: number): Observable<PedidoDetalle[]> {
    // Ajusta la ruta según tu backend (por ejemplo: /pedidos/:id/detalles)
    return this.http.get<PedidoDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  // ✅ Crear nuevo pedido con sus detalles
  createPedido(pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = {
      ...pedidoConDetalle,
      detalles: pedidoConDetalle.detalles || []
    };
    return this.http.post(this.apiUrl, payload);
  }

  // ✅ Actualizar pedido existente
  updatePedido(id: number, pedidoConDetalle: PedidoConDetalle): Observable<any> {
    const payload = {
      ...pedidoConDetalle,
      detalles: pedidoConDetalle.detalles || []
    };
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  // ✅ Eliminar pedido
  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
