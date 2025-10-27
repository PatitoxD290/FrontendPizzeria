import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, PedidoConDetalle } from '../../../../core/services/auth/pedido.service';
import { ClienteService } from '../../../../core/services/auth/cliente.service';
import { ProductoService } from '../../../../core/services/auth/producto.service';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
import { Cliente } from '../../../../core/models/cliente.model';
import { Producto } from '../../../../core/models/producto.model';
import { AuthService } from '../../../../core/services/auth/auth.service';

import { ClienteFormComponent } from '../../cliente/cliente-form/cliente-form.component';
import { MatDialog } from '@angular/material/dialog'; // Importar MatDialog

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule, 
  ],
  templateUrl: './pedido-form.component.html',
  styleUrls: ['./pedido-form.component.css']
})
export class PedidoFormComponent implements OnInit {

  pedido: PedidoConDetalle;
  detalleTemporal: PedidoDetalle = {
    id_pedido_d: 0,
    id_pedido: 0,
    id_producto: 0,
    id_tamano: 0,
    cantidad: 1,
    precio_total: 0,
  };

  clientes: Cliente[] = [];
  productos: Producto[] = [];

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<PedidoFormComponent>,
    private dialog: MatDialog, // ✅ Inyectar MatDialog
    @Inject(MAT_DIALOG_DATA) public data: { pedido?: Pedido }
  ) {
    const user = this.authService.getUser();
    const ahora = new Date();

    this.pedido = {
      id_pedido: data?.pedido?.id_pedido || 0,
      id_cliente: data?.pedido?.id_cliente || 0,
      id_usuario: user?.id ?? null, // ✅ CORREGIDO: el backend devuelve 'id', no 'usuario_id'
      fecha_registro: ahora.toISOString().split('T')[0], // YYYY-MM-DD
      hora_pedido: ahora.toTimeString().split(' ')[0], // HH:mm:ss
      sub_total: data?.pedido?.sub_total || 0,
      notas: data?.pedido?.notas || '',
      estado_p: data?.pedido?.estado_p || 'P',
      detalles: (data as any)?.pedido?.detalles || []
    };
  }

  // 🔹 Abrir modal para crear cliente
  crearCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((creado: boolean) => {
      if (creado) {
        // Recargar clientes para incluir el nuevo
        this.cargarClientes();
      }
    });
  }


  ngOnInit(): void {
    this.cargarClientes();
    this.cargarProductos();
  }

conCliente: boolean = false;

// En ngOnInit, filtrar clientes que no sean id=1
cargarClientes(): void {
  this.clienteService.getClientes().subscribe({
    next: (clientes) => {
      // Filtrar cliente_id = 1 (Clientes Varios) para selección
      this.clientes = clientes.filter(c => c.id_cliente !== 1);
    },
    error: (err) => console.error('Error al cargar clientes:', err)
  });
}

  /** 🔹 Cargar productos */
  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => (this.productos = productos),
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  /** 🔹 Obtener nombre de producto */
  getNombreProducto(producto_id: number): string {
    const producto = this.productos.find(p => p.producto_id === producto_id);
    return producto ? producto.nombre_producto : 'Producto eliminado';
  }

  /** 🔹 Agregar detalle */
  agregarDetalle(): void {
    if (!this.detalleTemporal.id_producto || this.detalleTemporal.cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Completa los datos del producto antes de agregarlo',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    const productoSeleccionado = this.productos.find(
      (p) => p.producto_id === this.detalleTemporal.id_producto
    );

    if (!productoSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Producto inválido',
        text: 'El producto seleccionado no es válido',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.detalleTemporal.precio_total = Number(productoSeleccionado.precio_venta) || 0;

    if (!this.pedido.detalles) this.pedido.detalles = [];
    this.pedido.detalles.push({ ...this.detalleTemporal });

    this.detalleTemporal = {
      id_pedido_d: 0,
      id_pedido: 0,
      id_producto: 0,
      id_tamano: 0,
      cantidad: 1,
      precio_total: 0,
    };

    this.actualizarTotales();

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: 'El producto se añadió correctamente al pedido',
      timer: 1500,
      showConfirmButton: false
    });
  }

  /** 🔹 Actualizar totales */
  actualizarTotales(): void {
    const subtotal = this.pedido.detalles?.reduce((acc, d) => acc + (Number(d.precio_total) || 0), 0) || 0;
    this.pedido.sub_total = subtotal;
  }

  /** 🔹 Eliminar detalle */
eliminarDetalle(index: number): void {
  Swal.fire({
    title: '¿Eliminar producto?',
    text: 'Este producto se quitará del pedido',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.pedido.detalles?.splice(index, 1);
      this.actualizarTotales();
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El producto ha sido eliminado del pedido',
        timer: 1200,
        showConfirmButton: false
      });
    }
  });
}


  /** 💾 Guardar pedido */
  savePedido(): void {
  if (this.conCliente && (!this.pedido.id_cliente || this.pedido.id_cliente <= 0)) {
    Swal.fire({
      icon: 'warning',
      title: 'Cliente requerido',
      text: 'Selecciona un cliente válido',
      confirmButtonColor: '#1976d2'
    });
    return;
  }

  // Si no se marca con cliente, backend tomará cliente_id=1 automáticamente
  if (!this.conCliente) this.pedido.id_cliente = 0;

    if (!this.pedido.detalles || this.pedido.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Agrega al menos un producto al pedido',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    if (this.pedido.sub_total <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Total inválido',
        text: 'El total del pedido no puede ser cero',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // ✅ Obtener usuario logueado correctamente
    const user = this.authService.getUser();
    this.pedido.id_usuario = user?.id ?? null; // 🔹 CORREGIDO

    const request$ =
      this.pedido.id_pedido === 0
        ? this.pedidoService.createPedido(this.pedido)
        : this.pedidoService.updatePedido(this.pedido.id_pedido, this.pedido);

    request$.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Pedido guardado',
          text: 'El pedido fue registrado correctamente ✅',
          confirmButtonColor: '#28a745'
        }).then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        console.error('❌ Error al guardar pedido:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al guardar el pedido. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  /** 🔹 Cerrar modal */
  close(): void {
    this.dialogRef.close(false);
  }
}