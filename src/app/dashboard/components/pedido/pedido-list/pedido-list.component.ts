import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, forkJoin, Subject } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

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
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
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

  searchTerm: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  // Variables para actualización automática
  private refreshSubscription!: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 segundos

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
  }

  // 🔄 Iniciar actualización automática
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

  // ⏹️ Detener actualización automática
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // 🔄 Método para refrescar manualmente
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

  // ✅ Cargar pedidos y calcular total
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

  // 🔄 Procesar datos de pedidos (reutilizable)
  private processPedidosData(pedidos: Pedido[]): void {
    pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);
    const pedidosConTotales: Pedido[] = [];

    const promises = pedidos.map(pedido =>
      this.pedidoService.getPedidoDetalles(pedido.ID_Pedido).toPromise()
        .then((detalles: PedidoDetalle[] | undefined) => {
          const listaDetalles = detalles ?? [];
          const total = listaDetalles.reduce((acc, det) => acc + (det.PrecioTotal || 0), 0);
          pedidosConTotales.push({ ...pedido, PrecioTotal: total });
        })
        .catch(() => pedidosConTotales.push({ ...pedido, PrecioTotal: 0 }))
    );

    Promise.all(promises).then(() => {
      // Mantener el paginador actual si existe
      const currentPaginator = this.dataSource.paginator;
      const currentFilter = this.dataSource.filter;
      
      this.dataSource = new MatTableDataSource(pedidosConTotales);
      this.dataSource.paginator = currentPaginator || this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filter = currentFilter;
      
      this.loadClientes();
      this.setupFilterPredicate();
    });
  }

  // ✅ Configurar filtro personalizado
  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (pedido: Pedido, filter: string) => {
      const term = filter.trim().toLowerCase();

      const clienteNombre = this.getNombreCliente(pedido.ID_Cliente).toLowerCase();
      const nota = pedido.Notas?.toLowerCase() || '';
      const fecha = this.formatFechaHora(pedido.Fecha_Registro, pedido.Hora_Pedido).toLowerCase();

      const coincideTexto =
        clienteNombre.includes(term) ||
        nota.includes(term) ||
        fecha.includes(term);

      // ✅ Filtro por rango de fecha
      let coincideFecha = true;
      if (this.fechaInicio && this.fechaFin && pedido.Fecha_Registro) {
        const fechaPedido = new Date(pedido.Fecha_Registro);
        coincideFecha = fechaPedido >= this.fechaInicio && fechaPedido <= this.fechaFin;
      }

      return coincideTexto && coincideFecha;
    };
  }

  // ✅ Filtro en tiempo real
  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  applyDateFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
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

  // ✅ CORREGIDO: Estados según tu especificación
  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'P': return 'Pendiente';
      case 'E': return 'Entregado';
      case 'C': return 'No entregado';
      case 'D': return 'No disponible';
      default: return 'Desconocido';
    }
  }

  // 🆕 EXPORTAR PDF
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
    
    // Título y cabecera
    this.agregarCabeceraPDF(doc, pedidos.length);
    
    // Tabla de datos
    this.agregarTablaPDF(doc, pedidos);
    
    // Totales y pie de página
    this.agregarTotalesPDF(doc, pedidos);
    
    // Guardar PDF
    doc.save(`Reporte_Pedidos_${new Date().toISOString().slice(0, 10)}.pdf`);
    
    this.snackBar.open('Reporte PDF generado correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private agregarCabeceraPDF(doc: jsPDF, totalPedidos: number): void {
    // Fondo decorativo
    doc.setFillColor(46, 125, 50); // Verde para pedidos
    doc.rect(0, 0, 297, 30, 'F');
    
    // Logo o ícono
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('📦', 15, 18);
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE PEDIDOS', 25, 18);
    
    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Comercial', 200, 12);
    doc.text('Tel: (01) 123-4567', 200, 17);
    doc.text('Email: info@empresa.com', 200, 22);
    
    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 15, 40);
    
    // Período del reporte
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
      `S/${(pedido.PrecioTotal || 0).toFixed(2)}`,
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
        fillColor: [56, 142, 60], // Verde más oscuro
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // ID
        1: { cellWidth: 40 }, // Cliente
        2: { cellWidth: 50 }, // Notas
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Precio Total
        4: { cellWidth: 25, halign: 'center' }, // Estado
        5: { cellWidth: 45, halign: 'center' } // Fecha/Hora
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        // Colorear estados
        if (data.section === 'body' && data.column.index === 4) {
          const estado = data.cell.raw as string;
          const ctx = doc as any;
          
          if (estado === 'Pendiente') {
            ctx.setTextColor(255, 152, 0); // Naranja
          } else if (estado === 'Entregado') {
            ctx.setTextColor(56, 142, 60); // Verde
          } else if (estado === 'No entregado') {
            ctx.setTextColor(244, 67, 54); // Rojo
          } else if (estado === 'No disponible') {
            ctx.setTextColor(158, 158, 158); // Gris
          }
        }
      },
      willDrawCell: (data) => {
        // Restaurar color negro para otras celdas
        if (data.section === 'body' && data.column.index !== 4) {
          const ctx = doc as any;
          ctx.setTextColor(0, 0, 0);
        }
      }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, pedidos: Pedido[]): void {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Calcular totales
    const totalPedidos = pedidos.length;
    const totalValor = pedidos.reduce((sum, pedido) => sum + (pedido.PrecioTotal || 0), 0);
    
    const pedidosPendientes = pedidos.filter(p => p.Estado_P === 'P').length;
    const pedidosEntregados = pedidos.filter(p => p.Estado_P === 'E').length;
    const pedidosNoEntregados = pedidos.filter(p => p.Estado_P === 'C').length;

    // Fondo para totales
    doc.setFillColor(240, 240, 240);
    doc.rect(10, finalY + 5, 277, 35, 'F');

    // Restaurar color negro
    doc.setTextColor(0, 0, 0);

    // Totales principales
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    doc.text('RESUMEN DE PEDIDOS', 15, finalY + 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pedidos: ${totalPedidos}`, 15, finalY + 22);
    doc.text(`Valor Total: S/${totalValor.toFixed(2)}`, 15, finalY + 28);

    // Estados de pedidos
    doc.text('POR ESTADO:', 120, finalY + 15);
    doc.text(`Pendientes: ${pedidosPendientes}`, 120, finalY + 22);
    doc.text(`Entregados: ${pedidosEntregados}`, 120, finalY + 28);
    doc.text(`No Entregados: ${pedidosNoEntregados}`, 200, finalY + 22);

    // Pie de página
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