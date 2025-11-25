import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services & Models
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Pedido } from '../../../../core/models/pedido.model';
import { Cliente } from '../../../../core/models/cliente.model';
import { VerDetallePedidoComponent } from '../ver-detalle-pedido/ver-detalle-pedido.component';

// Utils
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrls: ['./pedido-list.component.css']
})
export class PedidoListComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'ID_Pedido', 'Notas', 'ID_Cliente', 'PrecioTotal', 'Estado_P', 'Fecha_Registro', 'acciones'
  ];

  dataSource = new MatTableDataSource<Pedido>();
  clientesMap: Map<number, string> = new Map();
  loading = false;

  // Filtros
  searchTerm: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  selectedPeriodo: string = 'todos';

  private refreshSubscription!: Subscription;
  private readonly REFRESH_INTERVAL = 30000;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPedidos();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupFilterPredicate();
  }

  startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => this.pedidoService.getPedidos())
      )
      .subscribe({
        next: (pedidos) => {
          this.processPedidosData(pedidos);
        },
        error: (err) => {
          console.error('Error en actualización automática:', err);
        }
      });
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  refrescarManual(): void {
    this.loadPedidos();
    this.snackBar.open('Lista actualizada', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  viewDetallePedido(ID_Pedido: number) {
    this.dialog.open(VerDetallePedidoComponent, {
      width: '650px',
      data: { pedido_id: ID_Pedido }
    });
  }

  loadPedidos(): void {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.processPedidosData(pedidos);
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar pedidos:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error');
      }
    });
  }

  private processPedidosData(pedidos: Pedido[]): void {
    pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);
    
    const currentPaginator = this.dataSource.paginator;
    const currentFilter = this.dataSource.filter;
    
    this.dataSource.data = pedidos;
    
    // Restaurar paginador después de actualizar datos
    if (currentPaginator) {
      this.dataSource.paginator = currentPaginator;
    }
    
    this.dataSource.sort = this.sort;
    this.dataSource.filter = currentFilter;
    
    this.loadClientes();
    this.setupFilterPredicate();
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (pedido: Pedido, filter: string) => {
      const searchData = JSON.parse(filter);
      const searchTerm = searchData.term.toLowerCase();
      const fechaInicio = searchData.fechaInicio;
      const fechaFin = searchData.fechaFin;

      // Filtro por texto
      const clienteNombre = this.getNombreCliente(pedido.ID_Cliente).toLowerCase();
      const nota = pedido.Notas?.toLowerCase() || '';
      const idPedido = pedido.ID_Pedido.toString().toLowerCase();
      
      const coincideTexto = searchTerm === '' || 
        clienteNombre.includes(searchTerm) ||
        nota.includes(searchTerm) ||
        idPedido.includes(searchTerm);

      // Filtro por fecha
      let coincideFecha = true;
      if (fechaInicio && fechaFin && pedido.Fecha_Registro) {
        const fechaPedido = new Date(pedido.Fecha_Registro);
        fechaPedido.setHours(0, 0, 0, 0);
        
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        coincideFecha = fechaPedido >= inicio && fechaPedido <= fin;
      }

      return coincideTexto && coincideFecha;
    };
  }

  applyFilter(): void {
    const filterValue = {
      term: this.searchTerm.trim().toLowerCase(),
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };
    
    this.dataSource.filter = JSON.stringify(filterValue);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onPeriodoChange(): void {
    const hoy = new Date();
    
    switch (this.selectedPeriodo) {
      case 'hoy':
        this.fechaInicio = new Date();
        this.fechaFin = new Date();
        break;
        
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.fechaInicio = inicioSemana;
        this.fechaFin = new Date();
        break;
        
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaInicio = inicioMes;
        this.fechaFin = new Date();
        break;
        
      case 'mes_anterior':
        const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        this.fechaInicio = primerDiaMesAnterior;
        this.fechaFin = ultimoDiaMesAnterior;
        break;
        
      case 'todos':
      default:
        this.fechaInicio = null;
        this.fechaFin = null;
        break;
    }
    
    this.applyFilter();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.selectedPeriodo = 'todos';
    this.applyFilter();
  }

  loadClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: clientes => {
        clientes.forEach(c => {
          if (c.ID_Cliente) {
            const nombreCompleto = `${c.Nombre || ''} ${c.Apellido || ''}`.trim();
            this.clientesMap.set(c.ID_Cliente, nombreCompleto || 'Sin nombre');
          }
        });
      },
      error: err => console.error('Error al cargar clientes', err)
    });
  }

  getNombreCliente(ID_Cliente: number): string {
    return this.clientesMap.get(ID_Cliente) || 'Cliente desconocido';
  }

  formatFechaHora(fechaISO: string, horaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    if (horaISO) {
      const hora = new Date(horaISO);
      fecha.setHours(hora.getUTCHours());
      fecha.setMinutes(hora.getUTCMinutes());
    }
    return fecha.toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  formatMoneda(valor: number): string {
    return this.moneda.format(valor || 0);
  }

  getPrecioTotal(pedido: Pedido): number {
    return pedido.SubTotal;
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'P': return 'Pendiente';
      case 'E': return 'Entregado';
      case 'C': return 'No entregado';
      case 'D': return 'No disponible';
      default: return 'Desconocido';
    }
  }

  // ================================================================
  // 📄 MÉTODOS PARA PAGINACIÓN
  // ================================================================
  getTotalFiltrado(): number {
    return this.dataSource.filteredData.length;
  }

  onPageChange(event: any): void {
    // Manejar cambios de página si es necesario
    console.log('Cambio de página:', event);
  }

  exportarPDF(): void {
    if (this.dataSource.filteredData.length === 0) {
      Swal.fire('Información', 'No hay datos para generar el reporte PDF', 'info');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pedidos = this.dataSource.filteredData;
    
    this.agregarCabeceraPDF(doc, pedidos.length);
    this.agregarTablaPDF(doc, pedidos);
    this.agregarTotalesPDF(doc, pedidos);
    
    doc.save(`Reporte_Pedidos_${new Date().toISOString().slice(0, 10)}.pdf`);
    
    this.snackBar.open('Reporte PDF generado correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private agregarCabeceraPDF(doc: jsPDF, totalPedidos: number): void {
    doc.setFillColor(46, 125, 50);
    doc.rect(0, 0, 297, 30, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('📦', 15, 18);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE PEDIDOS', 25, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Comercial', 200, 12);
    doc.text('Tel: (01) 123-4567', 200, 17);
    doc.text('Email: info@empresa.com', 200, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 15, 40);
    
    let periodo = 'Todos los registros';
    if (this.fechaInicio && this.fechaFin) {
      periodo = `Del ${this.formatDateForPDF(this.fechaInicio)} al ${this.formatDateForPDF(this.fechaFin)}`;
    } else if (this.fechaInicio) {
      periodo = `Desde ${this.formatDateForPDF(this.fechaInicio)}`;
    } else if (this.fechaFin) {
      periodo = `Hasta ${this.formatDateForPDF(this.fechaFin)}`;
    }
    
    doc.text(`Período: ${periodo}`, 15, 45);
    doc.text(`Total de pedidos: ${totalPedidos}`, 200, 40);
  }

  private agregarTablaPDF(doc: jsPDF, pedidos: Pedido[]): void {
    const headers = [
      ['ID', 'CLIENTE', 'NOTAS', 'PRECIO TOTAL', 'ESTADO', 'FECHA/HORA REGISTRO']
    ];

    const data = pedidos.map(pedido => [
      pedido.ID_Pedido.toString(),
      this.getNombreCliente(pedido.ID_Cliente),
      pedido.Notas?.substring(0, 40) + (pedido.Notas && pedido.Notas.length > 40 ? '...' : '') || 'Sin notas',
      `S/${(this.getPrecioTotal(pedido) || 0).toFixed(2)}`,
      this.getEstadoTexto(pedido.Estado_P),
      this.formatFechaHoraPDF(pedido.Fecha_Registro, pedido.Hora_Pedido)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [56, 142, 60],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 45, halign: 'center' }
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const estado = data.cell.raw as string;
          const ctx = doc as any;
          
          if (estado === 'Pendiente') {
            ctx.setTextColor(255, 152, 0);
          } else if (estado === 'Entregado') {
            ctx.setTextColor(56, 142, 60);
          } else if (estado === 'No entregado') {
            ctx.setTextColor(244, 67, 54);
          } else if (estado === 'No disponible') {
            ctx.setTextColor(158, 158, 158);
          }
        }
      },
      willDrawCell: (data) => {
        if (data.section === 'body' && data.column.index !== 4) {
          const ctx = doc as any;
          ctx.setTextColor(0, 0, 0);
        }
      }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, pedidos: Pedido[]): void {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    const totalPedidos = pedidos.length;
    const totalValor = pedidos.reduce((sum, pedido) => sum + this.getPrecioTotal(pedido), 0);
    
    const pedidosPendientes = pedidos.filter(p => p.Estado_P === 'P').length;
    const pedidosEntregados = pedidos.filter(p => p.Estado_P === 'E').length;
    const pedidosNoEntregados = pedidos.filter(p => p.Estado_P === 'C').length;

    doc.setFillColor(240, 240, 240);
    doc.rect(10, finalY + 5, 277, 35, 'F');

    doc.setTextColor(0, 0, 0);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE PEDIDOS', 15, finalY + 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pedidos: ${totalPedidos}`, 15, finalY + 22);
    doc.text(`Valor Total: S/${totalValor.toFixed(2)}`, 15, finalY + 28);

    doc.text('POR ESTADO:', 120, finalY + 15);
    doc.text(`Pendientes: ${pedidosPendientes}`, 120, finalY + 22);
    doc.text(`Entregados: ${pedidosEntregados}`, 120, finalY + 28);
    doc.text(`No Entregados: ${pedidosNoEntregados}`, 200, finalY + 22);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este reporte fue generado automáticamente por el Sistema de Gestión Comercial', 15, 190);
    doc.text('Página 1 de 1', 260, 190);
  }

  private formatFechaHoraPDF(fechaISO: string, horaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    if (horaISO) {
      const hora = new Date(horaISO);
      fecha.setHours(hora.getUTCHours());
      fecha.setMinutes(hora.getUTCMinutes());
    }
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateForPDF(date: Date): string {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}