import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios
import { PedidoService, PedidosHoyResponse } from '../../../core/services/pedido.service';
import { VentaService, VentasHoyResponse, EstadisticasVentasResponse } from '../../../core/services/venta.service';
import { Venta } from '../../../core/models/venta.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentDate: string;
  
  // Datos para las cards
  ventasTotales: number = 0; // Ventas del mes actual
  pedidosHoy: number = 0;
  ventasHoy: number = 0;
  totalClientes: number = 0;
  
  // Datos para el gráfico
  ventasSemanales: number[] = [0, 0, 0, 0, 0, 0, 0];
  maxVentaSemana: number = 100;
  periodoGrafico: string = 'Esta Semana'; // Label para el botón
  
  // Estados de carga
  loadingCards: boolean = true;
  loadingChart: boolean = true;
  
  // Estadísticas de tendencia (Simulados o calculados si hay histórico)
  tendenciaVentasTotales: string = '+12.5%';
  tendenciaPedidosHoy: string = '+8.2%';
  tendenciaVentasHoy: string = '+12%';
  tendenciaClientes: string = '+5.7%';
topPizzas: any;

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
    // Capitalizar primera letra
    const fecha = now.toLocaleDateString('es-ES', options);
    return fecha.charAt(0).toUpperCase() + fecha.slice(1);
  }

  cargarDatosDashboard(): void {
    this.cargarDatosCards();
    this.cargarDatosGrafico('Esta Semana');
  }

  cargarDatosCards(): void {
    this.loadingCards = true;

    // 1. Cargar ventas de hoy (Resumen)
    this.ventaService.getVentasHoy().subscribe({
      next: (res: VentasHoyResponse) => {
        // El backend devuelve { resumen: { ingresos, totalVentas }, ventas: [] }
        this.ventasHoy = res.resumen.ingresos;
      },
      error: (err) => console.error('Error ventas hoy:', err)
    });

    // 2. Cargar estadísticas generales (Mes, Semana)
    this.ventaService.getEstadisticasVentas().subscribe({
      next: (res: EstadisticasVentasResponse) => {
        // Usamos ventas del mes como indicador principal de "Ventas Totales"
        this.ventasTotales = res.mes.ingresos;
      },
      error: (err) => console.error('Error estadísticas:', err)
    });

    // 3. Cargar pedidos de hoy y calcular clientes
    this.pedidoService.getPedidosHoy().subscribe({
      next: (res: PedidosHoyResponse) => {
        this.pedidosHoy = res.estadisticas.totalPedidos;
        // Estimación de clientes únicos hoy
        const clientesUnicos = new Set(res.pedidos.map(p => p.ID_Cliente)).size;
        // Si es 0, mostramos un número base acumulado (simulado) o real si tuvieras endpoint histórico
        this.totalClientes = clientesUnicos > 0 ? clientesUnicos : 0; 
        
        this.loadingCards = false;
      },
      error: (err) => {
        console.error('Error pedidos hoy:', err);
        this.loadingCards = false;
      }
    });
  }

  // =========================================
  // 📊 Lógica del Gráfico
  // =========================================

  cambiarPeriodoGrafico(periodo: string): void {
    this.periodoGrafico = periodo;
    this.cargarDatosGrafico(periodo);
  }

  cargarDatosGrafico(periodo: string): void {
    this.loadingChart = true;
    let observable;

    switch (periodo) {
      case 'Esta Semana':
        observable = this.ventaService.getVentasPorPeriodo('semana');
        break;

      case 'Semana Pasada':
        // Calcular una fecha de la semana pasada
        const fechaPasada = new Date();
        fechaPasada.setDate(fechaPasada.getDate() - 7);
        const fechaStr = fechaPasada.toISOString().split('T')[0];
        observable = this.ventaService.getVentasPorPeriodo('semana', fechaStr);
        break;

      case 'Último Mes':
        observable = this.ventaService.getVentasPorPeriodo('mes');
        break;

      default:
        observable = this.ventaService.getVentasPorPeriodo('semana');
    }

    observable.subscribe({
      next: (ventas: Venta[]) => {
        this.procesarDatosGrafico(ventas, periodo);
        this.loadingChart = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del gráfico:', error);
        this.loadingChart = false;
        // Resetear gráfico en error
        this.ventasSemanales = [0,0,0,0,0,0,0];
      }
    });
  }

  private procesarDatosGrafico(ventas: Venta[], periodo: string): void {
    // Inicializar en 0
    const acumulado = [0, 0, 0, 0, 0, 0, 0];
    
    // Si es 'Último Mes', agrupamos por semanas (4 semanas aprox)
    if (periodo === 'Último Mes') {
      // Lógica simplificada para mes: 4 bloques
      ventas.forEach(v => {
        const dia = new Date(v.Fecha_Registro).getDate();
        const semanaIndex = Math.min(Math.floor((dia - 1) / 7), 3); // 0, 1, 2, 3
        acumulado[semanaIndex] += Number(v.Total);
      });
      // Ajustar array a 4 posiciones para visualización si fuera necesario, 
      // o mantener 7 y usar solo 4. Por simplicidad del HTML actual (7 barras),
      // distribuiremos en los primeros 4 días o cambiaremos la lógica visual.
      // Para mantener compatibilidad con tu HTML de 7 barras, usaremos días de la semana igual.
      // (Normalmente un gráfico mensual tiene 30 barras o 4 barras).
    } 
    
    // Agrupación estándar por Días de la Semana (Lun-Dom)
    // JavaScript getDay(): 0=Domingo, 1=Lunes... 6=Sábado
    // Tu array ventasSemanales[0] es Lunes, [6] es Domingo
    ventas.forEach(v => {
      const fecha = new Date(v.Fecha_Registro);
      let diaIndex = fecha.getDay(); // 0-6 (Dom-Sab)
      
      // Convertir a 0=Lunes ... 6=Domingo
      diaIndex = diaIndex === 0 ? 6 : diaIndex - 1;
      
      acumulado[diaIndex] += Number(v.Total);
    });

    this.ventasSemanales = acumulado;
    
    // Calcular máximo para escalar el gráfico (altura de barras)
    const maxVal = Math.max(...this.ventasSemanales);
    this.maxVentaSemana = maxVal === 0 ? 100 : maxVal * 1.2; // +20% de margen superior
  }

  // =========================================
  // 🔧 Helpers Visuales
  // =========================================

  formatCurrency(amount: number): string {
    return `S/ ${amount.toFixed(2)}`;
  }

  calcularAlturaBarra(valor: number): string {
    if (this.maxVentaSemana === 0) return '0%';
    const porcentaje = (valor / this.maxVentaSemana) * 100;
    return `${porcentaje}%`;
  }

  getValorBarra(index: number): string {
    return this.formatCurrency(this.ventasSemanales[index]);
  }
}