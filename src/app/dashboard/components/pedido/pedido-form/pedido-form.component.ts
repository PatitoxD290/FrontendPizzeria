import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, PedidoConDetalle } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
import { Cliente } from '../../../../core/models/cliente.model';
import { Producto } from '../../../../core/models/producto.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteFormComponent } from '../../cliente/cliente-form/cliente-form.component';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
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
    ID_Pedido_D: 0,
    ID_Pedido: 0,
    ID_Producto: 0,
    ID_Tamano: 0,
    Cantidad: 1,
    PrecioTotal: 0,
    nombre_producto: '',
    nombre_categoria: ''
  };

  clientes: Cliente[] = [];
  productos: Producto[] = [];
  conCliente: boolean = false;

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<PedidoFormComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pedido?: PedidoConDetalle }
  ) {
    const user = this.authService.getUser();
    const ahora = new Date();

    this.pedido = {
      ID_Pedido: data?.pedido?.ID_Pedido || 0,
      ID_Cliente: data?.pedido?.ID_Cliente || 0,
      ID_Usuario: user?.id ?? 0,
      Fecha_Registro: ahora.toISOString().split('T')[0],
      Hora_Pedido: ahora.toTimeString().split(' ')[0],
      SubTotal: data?.pedido?.SubTotal || 0,
      Notas: data?.pedido?.Notas || '',
      Estado_P: data?.pedido?.Estado_P || 'P',
      detalles: data?.pedido?.detalles || []
    };
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarProductos();
  }

  /** 🔹 Cargar clientes */
  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes.filter(c => c.ID_Cliente !== 1);
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  /** 🔹 Cargar productos */
  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => this.productos = productos,
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  /** 🔹 Obtener nombre de producto */
  getNombreProducto(id_producto: number): string {
    const producto = this.productos.find(p => p.ID_Producto === id_producto);
    return producto ? producto.Nombre : 'Producto eliminado';
  }

  /** 🔹 Agregar detalle */
  agregarDetalle(): void {
    if (!this.detalleTemporal.ID_Producto || this.detalleTemporal.Cantidad <= 0) {
      Swal.fire('Datos incompletos', 'Completa los datos del producto antes de agregarlo', 'warning');
      return;
    }

    const productoSeleccionado = this.productos.find(p => p.ID_Producto === this.detalleTemporal.ID_Producto);
    if (!productoSeleccionado) {
      Swal.fire('Producto inválido', 'El producto seleccionado no es válido', 'error');
      return;
    }

    const precio = productoSeleccionado.Precio_Base || 0;
    const total = precio * this.detalleTemporal.Cantidad;

    const nuevoDetalle: PedidoDetalle = {
      ...this.detalleTemporal,
      PrecioTotal: total,
      nombre_producto: productoSeleccionado.Nombre,
      nombre_categoria: '',
    };

    if (!this.pedido.detalles) this.pedido.detalles = [];
    this.pedido.detalles.push(nuevoDetalle);

    this.detalleTemporal = {
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      ID_Producto: 0,
      ID_Tamano: 0,
      Cantidad: 1,
      PrecioTotal: 0,
      nombre_producto: '',
      nombre_categoria: ''
    };

    this.actualizarTotales();
  }

  /** 🔹 Actualizar totales */
  actualizarTotales(): void {
    this.pedido.SubTotal = this.pedido.detalles?.reduce((acc, d) => acc + d.PrecioTotal, 0) || 0;
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
    }).then((r) => {
      if (r.isConfirmed) {
        this.pedido.detalles?.splice(index, 1);
        this.actualizarTotales();
      }
    });
  }

  /** 💾 Guardar pedido */
  savePedido(): void {
    if (this.conCliente && (!this.pedido.ID_Cliente || this.pedido.ID_Cliente <= 0)) {
      Swal.fire('Cliente requerido', 'Selecciona un cliente válido', 'warning');
      return;
    }

    if (!this.conCliente) this.pedido.ID_Cliente = 1;

    if (!this.pedido.detalles || this.pedido.detalles.length === 0) {
      Swal.fire('Sin productos', 'Agrega al menos un producto al pedido', 'warning');
      return;
    }

    const user = this.authService.getUser();
    this.pedido.ID_Usuario = user?.id ?? 0;

    const request$ = this.pedido.ID_Pedido === 0
      ? this.pedidoService.createPedido(this.pedido)
      : this.pedidoService.updatePedido(this.pedido.ID_Pedido, this.pedido);

    request$.subscribe({
      next: () => {
        Swal.fire('Pedido guardado', 'El pedido fue registrado correctamente ✅', 'success')
          .then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        console.error('❌ Error al guardar pedido:', err);
        Swal.fire('Error', 'Ocurrió un error al guardar el pedido.', 'error');
      }
    });
  }

  /** 🔹 Abrir modal crear cliente */
  crearCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((creado: boolean) => {
      if (creado) this.cargarClientes();
    });
  }

  /** 🔹 Cerrar modal */
  close(): void {
    this.dialogRef.close(false);
  }
}
