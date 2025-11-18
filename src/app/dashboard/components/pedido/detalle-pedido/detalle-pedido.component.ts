import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

// Servicios y modelos
import { VentaService } from '../../../../core/services/venta.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { PedidoDetalle, PedidoConDetalle } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';

import { MatDialog } from '@angular/material/dialog';
import { VentaPedidoComponent } from '../venta-pedido/venta-pedido.component';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
  tamanos: Tamano[] = [];
  displayedColumns = ['producto', 'tamano', 'cantidad', 'precio', 'subtotal', 'acciones'];
  
  // 🔹 ELIMINADO: Campos de documento movidos a venta-pedido
  codigoPedido: string = '';

  constructor(
    private ordenService: OrdenService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private clienteService: ClienteService,
    private tamanoService: TamanoService,
    private dialog: MatDialog, 
    private ventaService: VentaService 
  ) {}

  ngOnInit(): void {
    this.tamanoService.getTamanos().subscribe({
      next: (data) => {
        this.tamanos = data;
        // Suscribirse a los detalles del servicio
        this.ordenService.detalles$.subscribe((detalles) => {
          this.detalles = detalles;
        });
      },
      error: (err) => console.error('Error al cargar tamaños:', err),
    });

    this.generarCodigoPedido();
  }

  getNombreTamano(detalle: PedidoDetalle): string {
    return detalle.nombre_tamano || '—';
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    this.ordenService.aumentarCantidad(detalle.ID_Producto_T, precioUnitario);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    if (detalle.Cantidad > 1) {
      const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
      this.ordenService.reducirCantidad(detalle.ID_Producto_T, precioUnitario);
    }
  }

  eliminar(detalle: PedidoDetalle) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará ${detalle.nombre_producto} (${detalle.nombre_tamano}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then(result => {
      if (result.isConfirmed) {
        this.ordenService.eliminarProducto(detalle.ID_Producto_T);
        Swal.fire({
          title: 'Eliminado',
          text: 'El producto fue eliminado del pedido.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });
      }
    });
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
  }

  generarCodigoPedido() {
    const numeros = '0123456789';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    for (let i = 0; i < 2; i++) codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    for (let i = 0; i < 2; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    this.codigoPedido = codigo;
  }

  realizarPedido() {
    if (this.detalles.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos antes de realizar el pedido.' });
      return;
    }

    const usuarioLogueado = this.authService.getUser();
    const idUsuario = usuarioLogueado?.ID_Usuario ?? 1;

    // 🔹 MODIFICADO: Abrir modal directamente sin validar cliente aquí
    this.abrirModalPago(idUsuario);
  }

  private abrirModalPago(idUsuario: number) {
    const dialogRef = this.dialog.open(VentaPedidoComponent, {
      width: '500px',
      data: { 
        total: this.getTotal(),
        codigoPedido: this.codigoPedido,
        idUsuario: idUsuario,
        detalles: this.detalles
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.registrado) {
        // 🔹 Limpiar carrito si se registró exitosamente
        this.ordenService.limpiar();
        this.generarCodigoPedido();
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Venta Registrada', 
          text: `Pedido ${this.codigoPedido} procesado correctamente.`,
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}