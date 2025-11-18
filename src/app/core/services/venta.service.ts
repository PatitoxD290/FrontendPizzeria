import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta, VentaCreacionDTO } from '../models/venta.model';

export interface VentasHoyResponse {
  ventas: Venta[];
  estadisticas: {
    totalVentas: number;
    totalIngresos: number;
    promedioVenta: number;
    fecha: string;
  };
}

export interface VentasPorPeriodoResponse {
  ventas: Venta[];
  estadisticas: {
    periodo: string;
    fechaConsulta: string;
    totalVentas: number;
    totalIngresos: number;
    promedioVenta: number;
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface EstadisticasVentasResponse {
  estadisticas: {
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
  };
  metodosPago: Array<{
    metodo: string;
    cantidad: number;
    total: number;
  }>;
}

export interface MetodoPagoStats {
  metodo: string;
  cantidad: number;
  total: number;
  porcentaje?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'http://localhost:3000/api/v2/ventas'; 

  constructor(private http: HttpClient) {}

  // =============================
  // 🟦 VENTAS BÁSICAS
  // =============================

  // 📘 Obtener todas las ventas
  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  // 📗 Obtener una venta por ID
  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  // 📙 Crear una nueva venta
  createVenta(ventaData: VentaCreacionDTO): Observable<any> {
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

  // 🧾 Obtener datos completos de boleta (datosBoletaVenta)
  getDatosBoletaVenta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/boleta/${id}`);
  }

  // 🧩 Obtener detalles completos de la venta (detallesVenta)
  getDetallesVenta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/detalles/${id}`);
  }

  // =============================
  // 🟩 NUEVOS ENDPOINTS - VENTAS DE HOY Y ESTADÍSTICAS
  // =============================

  /**
   * Obtener todas las ventas del día de hoy
   */
  getVentasHoy(): Observable<VentasHoyResponse> {
    return this.http.get<VentasHoyResponse>(`${this.apiUrl}/hoy`);
  }

  /**
   * Obtener ventas por período específico
   * @param periodo 'dia', 'semana', 'mes', 'año'
   * @param fecha Fecha específica (opcional, formato YYYY-MM-DD)
   */
  getVentasPorPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'año', fecha?: string): Observable<VentasPorPeriodoResponse> {
    let params = new HttpParams().set('periodo', periodo);
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<VentasPorPeriodoResponse>(`${this.apiUrl}/periodo`, { params });
  }

  /**
   * Obtener estadísticas generales de ventas
   */
  getEstadisticasVentas(): Observable<EstadisticasVentasResponse> {
    return this.http.get<EstadisticasVentasResponse>(`${this.apiUrl}/estadisticas`);
  }

  // =============================
  // 🟪 MÉTODOS UTILITARIOS AVANZADOS
  // =============================

  /**
   * Obtener estadísticas rápidas del día
   */
  getEstadisticasHoy(): Observable<VentasHoyResponse['estadisticas']> {
    return new Observable(observer => {
      this.getVentasHoy().subscribe({
        next: (response) => {
          observer.next(response.estadisticas);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener ventas de hoy con estadísticas de métodos de pago
   */
  getVentasHoyConMetodosPago(): Observable<{ventas: Venta[], estadisticas: VentasHoyResponse['estadisticas'], metodosPago: MetodoPagoStats[]}> {
    return new Observable(observer => {
      this.getVentasHoy().subscribe({
        next: (ventasResponse) => {
          this.getEstadisticasVentas().subscribe({
            next: (estadisticasResponse) => {
              const resultado = {
                ventas: ventasResponse.ventas,
                estadisticas: ventasResponse.estadisticas,
                metodosPago: estadisticasResponse.metodosPago
              };
              observer.next(resultado);
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener ventas de la semana actual
   */
  getVentasSemanaActual(): Observable<VentasPorPeriodoResponse> {
    return this.getVentasPorPeriodo('semana');
  }

  /**
   * Obtener ventas del mes actual
   */
  getVentasMesActual(): Observable<VentasPorPeriodoResponse> {
    return this.getVentasPorPeriodo('mes');
  }

  /**
   * Obtener ventas del año actual
   */
  getVentasAñoActual(): Observable<VentasPorPeriodoResponse> {
    return this.getVentasPorPeriodo('año');
  }

  /**
   * Obtener ventas de un día específico
   */
  getVentasPorDia(fecha: string): Observable<VentasPorPeriodoResponse> {
    return this.getVentasPorPeriodo('dia', fecha);
  }

  /**
   * Obtener ventas de un mes específico
   */
  getVentasPorMes(año: number, mes: number): Observable<VentasPorPeriodoResponse> {
    const fecha = `${año}-${mes.toString().padStart(2, '0')}-01`;
    return this.getVentasPorPeriodo('mes', fecha);
  }

  /**
   * Obtener ventas de un año específico
   */
  getVentasPorAño(año: number): Observable<VentasPorPeriodoResponse> {
    const fecha = `${año}-01-01`;
    return this.getVentasPorPeriodo('año', fecha);
  }

  /**
   * Obtener método de pago más popular del día
   */
  getMetodoPagoMasPopularHoy(): Observable<MetodoPagoStats> {
    return new Observable(observer => {
      this.getEstadisticasVentas().subscribe({
        next: (response) => {
          const metodoPopular = response.metodosPago.length > 0 
            ? response.metodosPago[0] 
            : { metodo: 'N/A', cantidad: 0, total: 0 };
          observer.next(metodoPopular);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener ingresos totales del día
   */
  getIngresosHoy(): Observable<number> {
    return new Observable(observer => {
      this.getEstadisticasVentas().subscribe({
        next: (response) => {
          observer.next(response.estadisticas.hoy.ingresos);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener comparativa de ingresos (hoy vs semana vs mes)
   */
  getComparativaIngresos(): Observable<{hoy: number, semana: number, mes: number}> {
    return new Observable(observer => {
      this.getEstadisticasVentas().subscribe({
        next: (response) => {
          const comparativa = {
            hoy: response.estadisticas.hoy.ingresos,
            semana: response.estadisticas.semana.ingresos,
            mes: response.estadisticas.mes.ingresos
          };
          observer.next(comparativa);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
}