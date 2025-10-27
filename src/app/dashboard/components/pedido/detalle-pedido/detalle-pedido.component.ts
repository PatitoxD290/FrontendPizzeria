import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { CarritoService } from '../../../services/carrito.service';
import { DetallePedido } from '../../../../core/models/detalle-pedido.model';
import { PedidoService, PedidoConDetalle } from '../../../services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

// Angular Material Dialog
import { MatDialog } from '@angular/material/dialog';
import { ClienteFormComponent } from '../../cliente/cliente-form/cliente-form.component';
import { ClienteService } from '../../../services/cliente.service';
import { Cliente } from '../../../../core/models/cliente.model';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css']
})
export class DetallePedidoComponent implements OnInit {
  detalles: DetallePedido[] = [];
  displayedColumns = ['producto', 'cantidad', 'precio', 'subtotal', 'acciones'];
  selectedCliente: Cliente | null = null;

  constructor(
    private carritoService: CarritoService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private clienteService: ClienteService
  ) {}

  ngOnInit() {
    this.carritoService.detalles$.subscribe((data) => {
      this.detalles = data;
    });
  }

  eliminar(id: number) {
    this.carritoService.eliminarProducto(id);
  }

  aumentarCantidad(detalle: DetallePedido) {
    this.carritoService.aumentarCantidad(detalle.producto_id);
  }

  reducirCantidad(detalle: DetallePedido) {
    this.carritoService.reducirCantidad(detalle.producto_id);
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + d.subtotal, 0);
  }

  async realizarPedido() {
    if (this.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'El carrito está vacío. Agrega productos para continuar.'
      });
      return;
    }

    const usuarioLogueado = this.authService.getUser();
    if (!usuarioLogueado) {
      Swal.fire({
        icon: 'error',
        title: 'No hay usuario logueado',
        text: 'Por favor inicia sesión para realizar el pedido.'
      });
      return;
    }

    // Preguntar si desea añadir un cliente
    const { value: accion } = await Swal.fire({
      title: 'Cliente',
      text: '¿Deseas ingresar los datos del cliente?',
      showCancelButton: true,
      confirmButtonText: 'Añadir',
      cancelButtonText: 'Usar cliente por defecto',
      icon: 'question'
    });

    if (accion) {
      // Abrir formulario de cliente como modal
      const dialogRef = this.dialog.open(ClienteFormComponent, {
        width: '400px',
        data: {} // nuevo cliente
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Después de crear, obtener el último cliente registrado
          this.clienteService.getClientes().subscribe(clientes => {
            this.selectedCliente = clientes[clientes.length - 1];
            this.enviarPedido(usuarioLogueado);
          });
        }
      });
    } else {
      // Usar cliente por defecto
      this.selectedCliente = { cliente_id: 1, nombre_completo: 'Cliente por defecto' };
      this.enviarPedido(usuarioLogueado);
    }
  }

  private enviarPedido(usuarioLogueado: any) {
    const pedido: PedidoConDetalle = {
      pedido_id: 0,
      cliente_id: this.selectedCliente?.cliente_id || 1,
      usuario_id: usuarioLogueado.usuario_id,
      subtotal: this.getTotal(),
      monto_descuento: 0,
      total: this.getTotal(),
      notas_generales: null,
      detalles: this.detalles.map(d => ({
        ...d,
        detalle_pedido_id: 0,
        pedido_id: 0
      }))
    };

    this.pedidoService.createPedido(pedido).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Pedido realizado',
          text: 'Tu pedido se ha enviado correctamente.'
        });
        this.carritoService.limpiar();
        this.selectedCliente = null;
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al realizar el pedido.'
        });
      }
    });
  }
}
