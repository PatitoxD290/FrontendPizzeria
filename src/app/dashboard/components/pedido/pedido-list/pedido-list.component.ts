import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model'; // ✅ Importamos ambos
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VerDetallePedidoComponent } from '../ver-detalle-pedido/ver-detalle-pedido.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrls: ['./pedido-list.component.css']
})
export class PedidoListComponent implements OnInit {
  displayedColumns: string[] = [
    'ID_Pedido', 'ID_Cliente', 'Fecha_Registro',
    'PrecioTotal', 'Notas', 'Estado_P', 'acciones'
  ];

  dataSource = new MatTableDataSource<Pedido>();
  clientesMap: Map<number, string> = new Map();
  loading = false;

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
    data: { pedido_id: ID_Pedido } // coincide con el nombre esperado
  });
}


  // ✅ Cargar pedidos y calcular el PrecioTotal sumando todos los detalles
loadPedidos(): void {
  this.loading = true;
  this.pedidoService.getPedidos().subscribe({
    next: pedidos => {
      pedidos.sort((a, b) => b.ID_Pedido - a.ID_Pedido);

      const pedidosConTotales: Pedido[] = [];

      const promises = pedidos.map(pedido =>
        this.pedidoService.getPedidoDetalles(pedido.ID_Pedido).toPromise()
          .then((detalles: PedidoDetalle[] | undefined) => {
            const listaDetalles: PedidoDetalle[] = detalles ?? []; // ✅ si undefined, usa []

            // ✅ Sumar el PrecioTotal de todos los detalles
            const total = listaDetalles.reduce((acc, det) => acc + (det.PrecioTotal || 0), 0);

            pedidosConTotales.push({ ...pedido, PrecioTotal: total });
          })
          .catch(() => pedidosConTotales.push({ ...pedido, PrecioTotal: 0 }))
      );

      Promise.all(promises).then(() => {
        this.dataSource.data = pedidosConTotales;
        this.loadClientes();
      });
    },
    error: err => {
      console.error('Error al cargar pedidos:', err);
      this.loading = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los pedidos',
        confirmButtonColor: '#d33'
      });
    }
  });
}

  // 🔹 Cargar los nombres de los clientes
  loadClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: clientes => {
        clientes.forEach(c => {
          if (c.ID_Cliente) {
            const nombreCompleto = `${c.Nombre || ''} ${c.Apellido || ''}`.trim();
            this.clientesMap.set(c.ID_Cliente, nombreCompleto || 'Sin nombre');
          }
        });
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar clientes:', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los clientes',
          confirmButtonColor: '#d33'
        });
      }
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.pedidoService.deletePedido(ID_Pedido).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El pedido fue eliminado correctamente',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadPedidos();
          },
          error: err => {
            console.error('Error al eliminar pedido:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el pedido. Intenta nuevamente.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }
}
