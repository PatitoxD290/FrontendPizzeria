import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Pedido } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { ClienteService } from '../../../services/cliente.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource } from '@angular/material/table';

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
    'pedido_id', 'cliente_id', 'fecha_hora',
    'subtotal', 'monto_descuento', 'total', 'estado_pedido', 'acciones'
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
  
  // Método para abrir dialog
viewDetallePedido(pedido_id: number) {
  this.dialog.open(VerDetallePedidoComponent, {
    width: '600px', // tamaño más ancho
    data: { pedido_id }
  });
}

  ngOnInit(): void {
    this.loadPedidos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator; // conectar paginador
  }

  loadPedidos(): void {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: pedidos => {
        // Ordenar de manera decreciente por pedido_id
        pedidos.sort((a, b) => b.pedido_id - a.pedido_id);
        this.dataSource.data = pedidos;
        this.loadClientes();
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

  loadClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: clientes => {
        clientes.forEach(c => {
          if (c.cliente_id) this.clientesMap.set(c.cliente_id, c.nombre_completo);
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

  getNombreCliente(cliente_id: number): string {
    return this.clientesMap.get(cliente_id) || 'Cliente desconocido';
  }

  formatFechaHora(fechaISO: string, horaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const hora = horaISO ? new Date(horaISO) : null;
    if (hora) {
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

  deletePedido(id: number): void {
    Swal.fire({
      title: '¿Eliminar este pedido?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.deletePedido(id).subscribe({
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
