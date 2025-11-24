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
import { MatChipsModule } from '@angular/material/chips';

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
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrls: ['./pedido-list.component.css']
})
export class PedidoListComponent implements OnInit, OnDestroy, AfterViewInit {
  
  displayedColumns: string[] = [
    'ID_Pedido', 
    'Cliente', 
    'Notas', 
    'Total', 
    'Estado', 
    'Fecha', 
    'acciones'
  ];

  dataSource = new MatTableDataSource<Pedido>();
  clientesMap = new Map<number, string>();
  
  loading = true;
  searchTerm: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  // Control de Auto-Refresh
  private destroy$ = new Subject<void>();
  private readonly REFRESH_INTERVAL = 30000; // 30 segundos

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setupAutoRefresh();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupFilterPredicate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 📥 Carga Inicial
  loadInitialData() {
    this.loading = true;
    forkJoin({
      clientes: this.clienteService.getClientes(),
      pedidos: this.pedidoService.getPedidos()
    }).subscribe({
      next: (data) => {
        this.mapClientes(data.clientes);
        this.dataSource.data = data.pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error carga inicial:', err);
        this.loading = false;
      }
    });
  }

  // 🔄 Auto Refresh
  setupAutoRefresh() {
    interval(this.REFRESH_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.pedidoService.getPedidos())
      )
      .subscribe({
        next: (pedidos) => {
          this.dataSource.data = pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);
        }
      });
  }

  refrescarManual() {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.dataSource.data = pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);
        this.loading = false;
        this.snackBar.open('Lista actualizada', 'OK', { duration: 2000 });
      },
      error: () => this.loading = false
    });
  }

  // 🛠️ Helpers
  private mapClientes(clientes: Cliente[]) {
    clientes.forEach(c => {
      this.clientesMap.set(c.ID_Cliente, `${c.Nombre} ${c.Apellido || ''}`.trim());
    });
  }

  getNombreCliente(id: number): string {
    return this.clientesMap.get(id) || 'Cliente Varios';
  }

  // 🔍 Filtros (CORREGIDO)
  private setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: Pedido, filter: string) => {
      // Usamos 'filter' en lugar de 'this.searchTerm' para evitar problemas de contexto
      // filter contiene el valor que asignamos en applyFilter()
      const txt = filter; 
      
      const nombreCliente = this.getNombreCliente(data.ID_Cliente);
      const clienteStr = (nombreCliente || '').toLowerCase();
      const notasStr = (data.Notas || '').toLowerCase();
      
      const matchText = 
        data.ID_Pedido.toString().includes(txt) ||
        clienteStr.includes(txt) ||
        notasStr.includes(txt);

      // Lógica de fechas
      let matchDate = true;
      if (this.fechaInicio || this.fechaFin) {
        const fechaPedido = new Date(data.Fecha_Registro);
        fechaPedido.setHours(0,0,0,0);

        if (this.fechaInicio) {
          const inicio = new Date(this.fechaInicio);
          inicio.setHours(0,0,0,0);
          if (fechaPedido < inicio) matchDate = false;
        }
        if (this.fechaFin) {
          const fin = new Date(this.fechaFin);
          fin.setHours(23,59,59,999);
          if (fechaPedido > fin) matchDate = false;
        }
      }

      return matchText && matchDate;
    };
  }

  applyFilter() {
    // Pasamos el término de búsqueda normalizado al filtro del dataSource
    const valor = (this.searchTerm || '').trim().toLowerCase();
    this.dataSource.filter = valor; // Esto dispara el filterPredicate pasando 'valor' como argumento 'filter'
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.applyFilter(); // Dispara la limpieza
  }

  // 👁️ Ver Detalle
  viewDetallePedido(pedido: Pedido) {
    this.dialog.open(VerDetallePedidoComponent, {
      width: '700px',
      data: { pedido_id: pedido.ID_Pedido }
    });
  }

  // 🎨 Estilos
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'P': return 'status-pending';
      case 'E': return 'status-completed';
      case 'C': return 'status-cancelled';
      default: return '';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'P': return 'Pendiente';
      case 'E': return 'Entregado';
      case 'C': return 'Cancelado';
      default: return estado;
    }
  }

  // 📄 PDF
  exportarPDF() {
    if (this.dataSource.filteredData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const doc = new jsPDF();
    const data = this.dataSource.filteredData;

    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Reporte de Pedidos', 14, 17);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 17);

    const columns = ['ID', 'Cliente', 'Total', 'Estado', 'Fecha', 'Notas'];
    const rows = data.map(p => [
      p.ID_Pedido,
      this.getNombreCliente(p.ID_Cliente),
      `S/ ${Number(p.SubTotal || 0).toFixed(2)}`,
      this.getEstadoLabel(p.Estado_P),
      new Date(p.Fecha_Registro).toLocaleDateString(),
      p.Notas || ''
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] }
    });

    doc.save(`Pedidos_${new Date().toISOString().slice(0,10)}.pdf`);
  }
}