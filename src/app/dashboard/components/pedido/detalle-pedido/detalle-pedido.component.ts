import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { OrdenService } from '../../../../core/services/orden.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { PedidoService, PedidoConDetalle } from '../../../../core/services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteFormComponent } from '../../cliente/cliente-form/cliente-form.component';

import Swal from 'sweetalert2';

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
    private ordenService: OrdenService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.ordenService.detalles$.subscribe((data) => {
      this.detalles = data;
    });
  }

  eliminar(id: number) {
    this.ordenService.eliminarProducto(id);
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    this.ordenService.aumentarCantidad(detalle.ID_Producto, detalle.PrecioTotal / detalle.Cantidad);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    this.ordenService.reducirCantidad(detalle.ID_Producto, detalle.PrecioTotal / detalle.Cantidad);
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
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

    // 🔹 Preguntar si desea ingresar cliente
    const { value: accion } = await Swal.fire({
      title: 'Cliente',
      text: '¿Deseas ingresar los datos del cliente?',
      showCancelButton: true,
      confirmButtonText: 'Añadir cliente',
      cancelButtonText: 'Usar cliente por defecto',
      icon: 'question'
    });

    if (accion) {
      const dialogRef = this.dialog.open(ClienteFormComponent, {
        width: '400px',
        data: {} // nuevo cliente
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.clienteService.getClientes().subscribe(clientes => {
            this.selectedCliente = clientes[clientes.length - 1];
            this.enviarPedido(usuarioLogueado);
          });
        }
      });
    } else {
      this.selectedCliente = {ID_Cliente: 1, Nombre: 'Cliente por defecto' } as Cliente;
      this.enviarPedido(usuarioLogueado);
    }
  }

  private enviarPedido(usuarioLogueado: any) {
    const pedido: PedidoConDetalle = {
      ID_Pedido: 0,
      ID_Cliente: this.selectedCliente?.ID_Cliente || 1,
      ID_Usuario: usuarioLogueado.ID_Usuario,
      SubTotal: this.getTotal(),
      Notas: '',
      Estado_P: 'P',
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: this.detalles.map(d => ({
        ...d,
        id_pedido_d: 0,
        id_pedido: 0
      }))
    };

    this.pedidoService.createPedido(pedido).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Pedido realizado',
          text: 'Tu pedido se ha enviado correctamente.'
        });
        this.ordenService.limpiar();
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
