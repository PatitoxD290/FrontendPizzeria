import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
<<<<<<< HEAD
=======
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
import { ComboDetalle } from '../../../../core/models/combo.model'; // 🔹 NUEVO: Importar ComboDetalle

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
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
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  
<<<<<<< HEAD
  detalles: PedidoDetalle[] = [];
  displayedColumns = ['producto', 'cantidad', 'precio', 'subtotal', 'acciones'];
=======
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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
    // El modelo ya trae Nombre_Producto o Nombre_Combo
    return detalle.Nombre_Producto || detalle.Nombre_Combo || 'Item sin nombre';
  }

<<<<<<< HEAD
  getDetalleItem(detalle: PedidoDetalle): string {
    // Mostrar descripción o categoría
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
=======
  // 🔹 NUEVO: Verificar si es un combo
  esCombo(detalle: PedidoDetalle): boolean {
    return !!detalle.ID_Combo || !!detalle.nombre_combo;
  }

  // 🔹 NUEVO: Obtener productos incluidos en el combo
  getProductosCombo(detalle: PedidoDetalle): string {
    if (this.esCombo(detalle) && (detalle as any).detallesCombo) {
      const detallesCombo = (detalle as any).detallesCombo as ComboDetalle[];
      const productos = detallesCombo.map(d => 
        `${d.Cantidad}x ${d.Producto_Nombre} (${d.Tamano_Nombre})`
      );
      return productos.join(', ');
    }
    return '';
  }

  // 🔹 NUEVO: Obtener información detallada del combo para tooltip
  getInfoCombo(detalle: PedidoDetalle): string {
    if (this.esCombo(detalle) && (detalle as any).detallesCombo) {
      const detallesCombo = (detalle as any).detallesCombo as ComboDetalle[];
      const productos = detallesCombo.map(d => 
        `${d.Cantidad}x ${d.Producto_Nombre} - ${d.Tamano_Nombre}`
      );
      return `Este combo incluye:\n${productos.join('\n')}`;
    }
    return '';
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    
    const idProductoTamano = detalle.ID_Producto_T || 0;
    const idCombo = detalle.ID_Combo || 0;
    
    this.ordenService.aumentarCantidad(idProductoTamano, idCombo, precioUnitario);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    if (detalle.Cantidad > 1) {
      const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
      
      const idProductoTamano = detalle.ID_Producto_T || 0;
      const idCombo = detalle.ID_Combo || 0;
      
      this.ordenService.reducirCantidad(idProductoTamano, idCombo, precioUnitario);
    }
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }

  eliminar(detalle: PedidoDetalle) {
    const nombre = this.getNombreItem(detalle);
    
    Swal.fire({
<<<<<<< HEAD
      title: '¿Quitar del pedido?',
      text: `Se eliminará "${nombre}".`,
=======
      title: '¿Eliminar producto?',
      text: `Se eliminará ${detalle.nombre_producto || detalle.nombre_combo || 'el item'}.`,
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(result => {
      if (result.isConfirmed) {
<<<<<<< HEAD
        const isCombo = this.esCombo(detalle);
        const id = isCombo ? detalle.ID_Combo! : detalle.ID_Producto_T!;
        
        this.ordenService.eliminarProducto(id, isCombo);
        
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
=======
        const idProductoTamano = detalle.ID_Producto_T || 0;
        const idCombo = detalle.ID_Combo || 0;
        
        this.ordenService.eliminarProducto(idProductoTamano, idCombo);
        Swal.fire({
          title: 'Eliminado',
          text: 'El producto/combo fue eliminado del pedido.',
          icon: 'success',
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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
      width: '900px', // Más ancho para que quepa el selector de cliente y resumen
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
<<<<<<< HEAD
        // Venta exitosa -> Limpiar todo
=======
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
        this.ordenService.limpiar();
        this.generarCodigoPedido();
        
        // El feedback de éxito lo da el componente de VentaPedido o aquí
        // Swal.fire(...) ya se suele manejar en el modal de pago al finalizar
      }
    });
  }
}