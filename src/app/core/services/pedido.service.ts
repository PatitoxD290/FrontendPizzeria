import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Pedido, 
  PedidoConDetalle, 
  PedidoDetalle, 
  PedidoCreacionDTO 
} from '../../core/models/pedido.model';

// Interfaces para respuestas específicas de reportes
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

  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/pedidos';

  constructor(private http: HttpClient) {}

  // ==========================================
  // 🟦 PEDIDOS (CRUD Básico)
  // ==========================================

  // Obtener listado general (Usado por la Cocina/Lista de Espera)
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  // Obtener uno con detalles
  getPedidoById(id: number): Observable<PedidoConDetalle> {
    return this.http.get<PedidoConDetalle>(`${this.apiUrl}/${id}`);
  }

  // 🟢 CREAR: Usamos el DTO (Usado por el Kiosko)
  createPedido(pedido: PedidoCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, pedido);
  }

  // 🟠 ACTUALIZAR
  updatePedido(id: number, pedido: Partial<PedidoCreacionDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, pedido);
  }

  // 🔴 ELIMINAR
  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // 🟧 ESTADO DEL PEDIDO (Usado por la Cocina)
  // ==========================================
  
  // Cambiar estado (P=Pendiente, E=Entregado, C=Cancelado)
  statusPedido(id: number, estado: 'P' | 'E' | 'C'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { Estado_P: estado });
  }

  // ==========================================
  // 🟨 DETALLES ADICIONALES (Usado para hidratar datos)
  // ==========================================

  // Obtener solo los detalles
  getPedidoDetalles(id: number): Observable<PedidoDetalle[]> {
    return this.http.get<PedidoDetalle[]>(`${this.apiUrl}/${id}/detalles`);
  }

  // ==========================================
  // 🟩 REPORTES Y DASHBOARD
  // ==========================================

  /**
   * Obtener resumen completo de hoy
   */
  getPedidosHoy(): Observable<PedidosHoyResponse> {
    return this.http.get<PedidosHoyResponse>(`${this.apiUrl}/hoy`);
  }

  /**
   * Obtener pedidos filtrados por estado (Backend endpoint)
   */
  getPedidosPorEstado(estado: 'P' | 'E' | 'C'): Observable<PedidosPorEstadoResponse> {
    return this.http.get<PedidosPorEstadoResponse>(`${this.apiUrl}/estado/${estado}`);
  }

  // ==========================================
  // 🟪 HELPERS (Filtros en Frontend)
  // ==========================================

  getEstadisticasHoy(): Observable<PedidosHoyResponse['estadisticas']> {
    return this.getPedidosHoy().pipe(
      map(response => response.estadisticas)
    );
  }

  getPedidosPendientesHoy(): Observable<PedidoConDetalle[]> {
    return this.getPedidosHoy().pipe(
      map(response => response.pedidos.filter(p => p.Estado_P === 'P'))
    );
  }

  getPedidosEntregadosHoy(): Observable<PedidoConDetalle[]> {
    return this.getPedidosHoy().pipe(
      map(response => response.pedidos.filter(p => p.Estado_P === 'E'))
    );
  }

  getContadoresEstadosHoy(): Observable<{pendientes: number, entregados: number, cancelados: number}> {
    return this.getPedidosHoy().pipe(
      map(res => ({
        pendientes: res.estadisticas.pedidosPendientes,
        entregados: res.estadisticas.pedidosEntregados,
        cancelados: res.estadisticas.pedidosCancelados
      }))
    );
  }
}