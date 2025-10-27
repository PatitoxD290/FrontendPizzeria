import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { OrdenService } from '../../../../core/services/auth/orden.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { PedidoService, PedidoConDetalle } from '../../../../core/services/auth/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

// Angular Material Dialog
import { MatDialog } from '@angular/material/dialog';
import { ClienteFormComponent } from '../../cliente/cliente-form/cliente-form.component';
import { ClienteService } from '../../../../core/services/auth/cliente.service';
import { Cliente } from '../../../../core/models/cliente.model';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css']
})
export class DetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
  displayedColumns = ['producto', 'cantidad', 'precio', 'subtotal', 'acciones'];
  selectedCliente: Cliente | null = null;

  constructor(
    private OrdenService: OrdenService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private clienteService: ClienteService
  ) {}

  ngOnInit() {
    this.OrdenService.detalles$.subscribe((data) => {
      this.detalles = data;
    });
  }

  eliminar(id: number) {
    this.OrdenService.eliminarProducto(id);
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    this.OrdenService.aumentarCantidad(detalle.id_producto);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    this.OrdenService.reducirCantidad(detalle.id_producto);
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + d.precio_total, 0);
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
      this.selectedCliente = { id_cliente: 1, nombre: 'Cliente por defecto' };
      this.enviarPedido(usuarioLogueado);
    }
  }

  private enviarPedido(usuarioLogueado: any) {
    const pedido: PedidoConDetalle = {
      id_pedido: 0,
      id_cliente: this.selectedCliente?.id_cliente || 1,
      id_usuario: usuarioLogueado.id_usuario,
      sub_total: this.getTotal(),
      notas: '',
      estado_p: 'P',
      fecha_registro: new Date().toISOString().split('T')[0], 
      hora_pedido: new Date().toTimeString().split(' ')[0],
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
        this.OrdenService.limpiar();
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