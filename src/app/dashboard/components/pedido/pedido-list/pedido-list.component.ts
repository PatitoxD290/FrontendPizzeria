import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { VerDetallePedidoComponent } from '../ver-detalle-pedido/ver-detalle-pedido.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrls: ['./pedido-list.component.css']
})
export class PedidoListComponent implements OnInit {
  displayedColumns: string[] = [
    'ID_Pedido', 'Notas', 'ID_Cliente', 'PrecioTotal', 'Estado_P', 'Fecha_Registro', 'acciones'
  ];

  dataSource = new MatTableDataSource<Pedido>();
  clientesMap: Map<number, string> = new Map();
  loading = false;

  searchTerm: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPedidos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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
      next: pedidos => {
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
          this.dataSource = new MatTableDataSource(pedidosConTotales);
          this.dataSource.paginator = this.paginator;
          this.loadClientes();

          // ✅ Definir filtro personalizado
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

          this.loading = false;
        });
      },
      error: err => {
        console.error('Error al cargar pedidos:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error');
      }
    });
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

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'P': return 'Pendiente';
      case 'C': return 'Completado';
      case 'E': return 'En proceso';
      case 'D': return 'Descartado';
      default: return 'Desconocido';
    }
  }

  deletePedido(ID_Pedido: number): void {
    Swal.fire({
      title: '¿Eliminar este pedido?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.pedidoService.deletePedido(ID_Pedido).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El pedido fue eliminado correctamente', 'success');
            this.loadPedidos();
          },
          error: err => {
            console.error('Error al eliminar pedido:', err);
            Swal.fire('Error', 'No se pudo eliminar el pedido', 'error');
          }
        });
      }
    });
  }
}
