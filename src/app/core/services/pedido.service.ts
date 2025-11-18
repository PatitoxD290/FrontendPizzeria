// src/app/dashboard/services/pedido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoDetalle } from '../models/pedido.model';

export interface PedidoConDetalle extends Pedido {
  detalles?: PedidoDetalle[];
}

export interface PedidosHoyResponse {
  pedidos: PedidoConDetalle[];
  estadisticas: {
    totalPedidos: number;
    pedidosPendientes: number;
    pedidosEntregados: number;
    pedidosCancelados: number;
    totalIngresos: number;
    fecha: string;
  };
}

export interface PedidosPorEstadoResponse {
  pedidos: PedidoConDetalle[];
  total: number;
  estado: string;
  descripcion_estado: string;
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

  // =============================
  // 🟩 NUEVOS ENDPOINTS - PEDIDOS DE HOY
  // =============================

  /**
   * Obtener todos los pedidos del día de hoy con todos los estados
   */
  getPedidosHoy(): Observable<PedidosHoyResponse> {
    return this.http.get<PedidosHoyResponse>(`${this.apiUrl}/hoy`);
  }

  /**
   * Obtener pedidos por estado específico
   * @param estado 'P' = Pendiente, 'E' = Entregado, 'C' = Cancelado
   */
  getPedidosPorEstado(estado: 'P' | 'E' | 'C'): Observable<PedidosPorEstadoResponse> {
    return this.http.get<PedidosPorEstadoResponse>(`${this.apiUrl}/estado/${estado}`);
  }

  // =============================
  // 🟪 MÉTODOS UTILITARIOS
  // =============================

  /**
   * Obtener estadísticas rápidas de pedidos del día
   */
  getEstadisticasHoy(): Observable<PedidosHoyResponse['estadisticas']> {
    return new Observable(observer => {
      this.getPedidosHoy().subscribe({
        next: (response) => {
          observer.next(response.estadisticas);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener solo pedidos pendientes de hoy
   */
  getPedidosPendientesHoy(): Observable<PedidoConDetalle[]> {
    return new Observable(observer => {
      this.getPedidosHoy().subscribe({
        next: (response) => {
          const pendientes = response.pedidos.filter(pedido => pedido.Estado_P === 'P');
          observer.next(pendientes);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener solo pedidos entregados de hoy
   */
  getPedidosEntregadosHoy(): Observable<PedidoConDetalle[]> {
    return new Observable(observer => {
      this.getPedidosHoy().subscribe({
        next: (response) => {
          const entregados = response.pedidos.filter(pedido => pedido.Estado_P === 'E');
          observer.next(entregados);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener contadores de estados para hoy
   */
  getContadoresEstadosHoy(): Observable<{pendientes: number, entregados: number, cancelados: number}> {
    return new Observable(observer => {
      this.getPedidosHoy().subscribe({
        next: (response) => {
          const contadores = {
            pendientes: response.estadisticas.pedidosPendientes,
            entregados: response.estadisticas.pedidosEntregados,
            cancelados: response.estadisticas.pedidosCancelados
          };
          observer.next(contadores);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
}