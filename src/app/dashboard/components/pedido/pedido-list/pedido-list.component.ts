import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/auth/pedido.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrls: ['./pedido-list.component.css']
})
export class PedidoListComponent implements OnInit {

  displayedColumns: string[] = [
    'pedido_id', 'cliente_id', 'usuario_id', 'fecha_hora', 
    'subtotal', 'monto_descuento', 'total', 'estado_pedido', 'acciones'
  ];
  pedidos: Pedido[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.loadPedidos();
  }

  loadPedidos() {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: data => {
        this.pedidos = data;
        this.loading = false;
        // Inicializar paginador después de cargar datos
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = this.pedidos.length;
          }
        });
      },
      error: err => { 
        console.error(err); 
        this.loading = false; 
      }
    });
  }

  deletePedido(id: number) {
    if (!confirm('¿Eliminar este pedido?')) return;
    this.pedidoService.deletePedido(id).subscribe({
      next: () => this.loadPedidos(),
      error: err => console.error(err)
    });
  }
}
