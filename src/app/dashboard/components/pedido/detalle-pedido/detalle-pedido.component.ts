import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios y Modelos
import { OrdenService } from '../../../../core/services/orden.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { VentaPedidoComponent } from '../venta-pedido/venta-pedido.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  
  detalles: PedidoDetalle[] = [];
  codigoPedido: string = '';

  constructor(
    private ordenService: OrdenService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del carrito
    this.ordenService.detalles$.subscribe((detalles) => {
      this.detalles = detalles;
    });

    this.generarCodigoPedido();
  }

  // 🔄 Getters Visuales
  getNombreItem(detalle: PedidoDetalle): string {
    return detalle.Nombre_Producto || detalle.Nombre_Combo || 'Item sin nombre';
  }

  getDetalleItem(detalle: PedidoDetalle): string {
    return detalle.Descripcion || detalle.Tamano_Nombre || '';
  }

  esCombo(detalle: PedidoDetalle): boolean {
    return !!detalle.ID_Combo;
  }

  // ➕➖ Gestión de Cantidades
  aumentarCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    const isCombo = this.esCombo(detalle);
    const id = isCombo ? detalle.ID_Combo! : detalle.ID_Producto_T!;
    
    this.ordenService.aumentarCantidad(id, isCombo, precioUnitario);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    const isCombo = this.esCombo(detalle);
    const id = isCombo ? detalle.ID_Combo! : detalle.ID_Producto_T!;

    this.ordenService.reducirCantidad(id, isCombo, precioUnitario);
  }

  eliminar(detalle: PedidoDetalle) {
    const nombre = this.getNombreItem(detalle);
    
    Swal.fire({
      title: '¿Quitar del pedido?',
      text: `Se eliminará "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(result => {
      if (result.isConfirmed) {
        const isCombo = this.esCombo(detalle);
        const id = isCombo ? detalle.ID_Combo! : detalle.ID_Producto_T!;
        
        this.ordenService.eliminarProducto(id, isCombo);
        
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Eliminado' });
      }
    });
  }

  // 💰 Total
  getTotal(): number {
    return this.ordenService.obtenerTotal();
  }

  // 🆔 Generador de Código Local (Visual)
  generarCodigoPedido() {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100);
    this.codigoPedido = `PED-${timestamp}-${random}`;
  }

  // 🚀 Finalizar
  realizarPedido() {
    if (this.detalles.length === 0) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Carrito vacío', 
        text: 'Agrega productos antes de continuar.' 
      });
      return;
    }

    const usuarioLogueado = this.authService.getUser();
    const idUsuario = usuarioLogueado?.ID_Usuario ?? 1;

    this.abrirModalPago(idUsuario);
  }

  private abrirModalPago(idUsuario: number) {
    const dialogRef = this.dialog.open(VentaPedidoComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
      data: { 
        total: this.getTotal(),
        codigoPedido: this.codigoPedido,
        idUsuario: idUsuario,
        detalles: this.detalles
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.registrado) {
        this.ordenService.limpiar();
        this.generarCodigoPedido();
      }
    });
  }
}