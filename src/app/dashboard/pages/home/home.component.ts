import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PedidoService, PedidosHoyResponse } from '../../../core/services/pedido.service';
import { VentaService, VentasHoyResponse, EstadisticasVentasResponse } from '../../../core/services/venta.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentDate: string;
  
  // Datos para las cards
  ventasTotales: number = 0;
  pedidosHoy: number = 0;
  ventasHoy: number = 0;
  totalClientes: number = 0;
  
  // Datos para el gráfico
  ventasSemanales: number[] = [0, 0, 0, 0, 0, 0, 0];
  maxVentaSemana: number = 0;
  
  // Estados de carga
  loadingCards: boolean = true;
  loadingChart: boolean = true;
  
  // Estadísticas de tendencia (puedes calcularlas comparando con datos históricos)
  tendenciaVentasTotales: string = '+12.5%';
  tendenciaPedidosHoy: string = '+8.2%';
  tendenciaVentasHoy: string = '+12%';
  tendenciaClientes: string = '+5.7%';

  constructor(
    private pedidoService: PedidoService,
    private ventaService: VentaService
  ) {
    this.currentDate = this.getFormattedDate();
  }

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  private getFormattedDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('es-ES', options);
  }

  cargarDatosDashboard(): void {
    this.cargarDatosCards();
    this.cargarDatosGrafico();
  }

  cargarDatosCards(): void {
    this.loadingCards = true;

    // Cargar ventas de hoy
    this.ventaService.getVentasHoy().subscribe({
      next: (ventasResponse: VentasHoyResponse) => {
        this.ventasHoy = ventasResponse.estadisticas.totalIngresos;
        
        // Cargar estadísticas generales para ventas totales
        this.ventaService.getEstadisticasVentas().subscribe({
          next: (estadisticasResponse: EstadisticasVentasResponse) => {
            this.ventasTotales = estadisticasResponse.estadisticas.mes.ingresos;
            
            // Cargar pedidos de hoy
            this.pedidoService.getPedidosHoy().subscribe({
              next: (pedidosResponse: PedidosHoyResponse) => {
                this.pedidosHoy = pedidosResponse.estadisticas.totalPedidos;
                this.totalClientes = this.estimarTotalClientes(pedidosResponse);
                this.loadingCards = false;
              },
              error: (error) => {
                console.error('Error al cargar pedidos:', error);
                this.loadingCards = false;
              }
            });
          },
          error: (error) => {
            console.error('Error al cargar estadísticas:', error);
            this.loadingCards = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar ventas de hoy:', error);
        this.loadingCards = false;
      }
    });
  }

  cargarDatosGrafico(): void {
    this.loadingChart = true;

    // Obtener ventas de la semana actual
    this.ventaService.getVentasSemanaActual().subscribe({
      next: (response) => {
        this.procesarDatosGrafico(response.ventas);
        this.loadingChart = false;
      },
      error: (error) => {
        console.error('Error al cargar ventas semanales:', error);
        
        // En caso de error, cargar ventas de los últimos 7 días como fallback
        this.cargarVentasUltimos7Dias();
      }
    });
  }

  private cargarVentasUltimos7Dias(): void {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 6); // Últimos 7 días

    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    this.ventaService.getVentasPorFecha(fechaInicioStr, fechaFinStr).subscribe({
      next: (ventas) => {
        this.procesarDatosGrafico(ventas);
        this.loadingChart = false;
      },
      error: (error) => {
        console.error('Error al cargar ventas de los últimos 7 días:', error);
        this.loadingChart = false;
      }
    });
  }

  private procesarDatosGrafico(ventas: any[]): void {
    // Agrupar ventas por día de la semana
    const ventasPorDia = this.agruparVentasPorDia(ventas);
    
    // Ordenar por días de la semana (Lunes a Domingo)
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    this.ventasSemanales = diasSemana.map(dia => ventasPorDia[dia] || 0);
    
    // Calcular el máximo para escalar el gráfico
    this.maxVentaSemana = Math.max(...this.ventasSemanales, 100); // Mínimo 100 para que no quede vacío
  }

  private agruparVentasPorDia(ventas: any[]): { [key: string]: number } {
    const ventasPorDia: { [key: string]: number } = {};
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    ventas.forEach(venta => {
      const fecha = new Date(venta.Fecha_Registro);
      const diaSemana = dias[fecha.getDay()];
      const total = Number(venta.Total) || 0;

      if (ventasPorDia[diaSemana]) {
        ventasPorDia[diaSemana] += total;
      } else {
        ventasPorDia[diaSemana] = total;
      }
    });

    return ventasPorDia;
  }

  private estimarTotalClientes(pedidosResponse: PedidosHoyResponse): number {
    // Esta es una estimación básica - puedes ajustarla según tu lógica de negocio
    // Por ejemplo, podrías contar clientes únicos en los pedidos de hoy
    const clientesUnicos = new Set(pedidosResponse.pedidos.map(pedido => pedido.ID_Cliente));
    return clientesUnicos.size > 0 ? clientesUnicos.size : 1548; // Fallback a un valor por defecto
  }

  // Método para formatear montos en soles
  formatCurrency(amount: number): string {
    return `S/ ${amount.toFixed(2)}`;
  }

  // Método para calcular el porcentaje de altura de las barras
  calcularAlturaBarra(valor: number): string {
    if (this.maxVentaSemana === 0) return '0%';
    return `${(valor / this.maxVentaSemana) * 100}%`;
  }

  // Método para obtener el valor formateado de la barra
  getValorBarra(index: number): string {
    return this.formatCurrency(this.ventasSemanales[index]);
  }

  // Agrega este método en la clase HomeComponent
cambiarPeriodoGrafico(event: any): void {
  const periodo = event.target.value;
  this.loadingChart = true;

  switch (periodo) {
    case 'Esta Semana':
      this.ventaService.getVentasSemanaActual().subscribe({
        next: (response) => {
          this.procesarDatosGrafico(response.ventas);
          this.loadingChart = false;
        },
        error: (error) => {
          console.error('Error al cargar ventas semanales:', error);
          this.loadingChart = false;
        }
      });
      break;

    case 'Semana Pasada':
      // Calcular fecha de la semana pasada
      const fechaFinPasada = new Date();
      fechaFinPasada.setDate(fechaFinPasada.getDate() - 7);
      const fechaInicioPasada = new Date(fechaFinPasada);
      fechaInicioPasada.setDate(fechaInicioPasada.getDate() - 6);

      const fechaInicioStr = fechaInicioPasada.toISOString().split('T')[0];
      const fechaFinStr = fechaFinPasada.toISOString().split('T')[0];

      this.ventaService.getVentasPorFecha(fechaInicioStr, fechaFinStr).subscribe({
        next: (ventas) => {
          this.procesarDatosGrafico(ventas);
          this.loadingChart = false;
        },
        error: (error) => {
          console.error('Error al cargar ventas semana pasada:', error);
          this.loadingChart = false;
        }
      });
      break;

    case 'Último Mes':
      this.ventaService.getVentasMesActual().subscribe({
        next: (response) => {
          // Para el gráfico mensual, podrías agrupar por semanas o mostrar los últimos 30 días
          this.procesarDatosGrafico(response.ventas);
          this.loadingChart = false;
        },
        error: (error) => {
          console.error('Error al cargar ventas mensuales:', error);
          this.loadingChart = false;
        }
      });
      break;
  }
}
}