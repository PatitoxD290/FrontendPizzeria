import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Venta, VentaCreacionDTO } from '../../core/models/venta.model'; // ⚠️ Ajusta la ruta

// ==========================================
// 📝 INTERFACES DE RESPUESTA (Backend)
// ==========================================

export interface ResumenVentasHoy {
  totalVentas: number;
  ingresos: number;
}

export interface VentasHoyResponse {
  resumen: ResumenVentasHoy;
  ventas: Venta[];
}

export interface EstadisticasVentasResponse {
  hoy: {
    totalVentas: number;
    ingresos: number;
  };
  semana: {
    totalVentas: number;
    ingresos: number;
  };
  mes: {
    totalVentas: number;
    ingresos: number;
  };
  metodos_pago: Array<{
    Metodo: string;
    Cantidad: number;
    Total: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/ventas'; 

  constructor(private http: HttpClient) {}

  // ==========================================
  // 🟦 VENTAS BÁSICAS (CRUD)
  // ==========================================

  // Obtener historial completo
  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  // Obtener una venta por ID
  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  // Crear una nueva venta
  createVenta(ventaData: VentaCreacionDTO): Observable<any> {
    return this.http.post(this.apiUrl, ventaData);
  }

  // Actualizar venta (montos)
  updateVenta(id: number, venta: Partial<Venta>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, venta);
  }

  // ==========================================
  // 🧾 DETALLES Y BOLETA
  // ==========================================

  // Datos para imprimir boleta
  getDatosBoletaVenta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/boleta/${id}`);
  }

  // Detalles completos para visualizar en pantalla
  getDetallesVenta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/detalles/${id}`);
  }

  // ==========================================
  // 🟩 REPORTES Y DASHBOARD
  // ==========================================

  /**
   * Obtener ventas de hoy + resumen rápido
   */
  getVentasHoy(): Observable<VentasHoyResponse> {
    return this.http.get<VentasHoyResponse>(`${this.apiUrl}/hoy`);
  }

  /**
   * Obtener ventas por período (día, semana, mes, año)
   */
  getVentasPorPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'año', fecha?: string): Observable<Venta[]> {
    let params = new HttpParams().set('periodo', periodo);
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<Venta[]>(`${this.apiUrl}/periodo`, { params });
  }

  /**
   * Obtener estadísticas generales (Cards del Dashboard)
   */
  getEstadisticasVentas(): Observable<EstadisticasVentasResponse> {
    return this.http.get<EstadisticasVentasResponse>(`${this.apiUrl}/estadisticas`);
  }

  // ==========================================
  // 🟪 MÉTODOS UTILITARIOS (Filtros en Frontend)
  // ==========================================

  /**
   * Obtener solo el resumen numérico de hoy
   */
  getResumenHoy(): Observable<ResumenVentasHoy> {
    return this.getVentasHoy().pipe(map(res => res.resumen));
  }

  /**
   * Obtener listado de métodos de pago para gráficas
   */
  getMetodosPagoStats(): Observable<any[]> {
    return this.getEstadisticasVentas().pipe(map(res => res.metodos_pago));
  }

  /**
   * Obtener comparativa rápida de ingresos
   */
  getComparativaIngresos(): Observable<{hoy: number, semana: number, mes: number}> {
    return this.getEstadisticasVentas().pipe(
      map(res => ({
        hoy: res.hoy.ingresos,
        semana: res.semana.ingresos,
        mes: res.mes.ingresos
      }))
    );
  }
}