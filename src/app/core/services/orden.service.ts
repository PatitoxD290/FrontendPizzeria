// src/app/core/services/orden.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PedidoDetalle } from '../models/pedido.model';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private detalles: PedidoDetalle[] = [];
  private detallesSubject = new BehaviorSubject<PedidoDetalle[]>([]);
  detalles$ = this.detallesSubject.asObservable();

  constructor() {}

  // 🟩 Agregar producto al pedido
  agregarProducto(detalle: PedidoDetalle) {
    if (!detalle.Cantidad || detalle.Cantidad <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Cantidad inválida',
        text: 'No puedes agregar un producto con cantidad 0.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    // ✅ Usar ID_Producto_T en lugar de ID_Producto
    const existente = this.detalles.find(
      d => d.ID_Producto_T === detalle.ID_Producto_T
    );

    if (existente) {
      existente.Cantidad += detalle.Cantidad;
      existente.PrecioTotal += detalle.PrecioTotal;
    } else {
      this.detalles.push({ ...detalle });
    }

    this.detallesSubject.next([...this.detalles]);
  }

  // ⬆️ Aumentar cantidad
 // En orden.service.ts - verificar que los métodos usen ID_Producto_T
aumentarCantidad(idProductoTamano: number, precioBase: number) {
  const detalle = this.detalles.find(d => d.ID_Producto_T === idProductoTamano);
  if (detalle) {
    detalle.Cantidad++;
    detalle.PrecioTotal = detalle.Cantidad * precioBase;
    this.detallesSubject.next([...this.detalles]);
  }
}

reducirCantidad(idProductoTamano: number, precioBase: number) {
  const detalle = this.detalles.find(d => d.ID_Producto_T === idProductoTamano);
  if (detalle && detalle.Cantidad > 1) {
    detalle.Cantidad--;
    detalle.PrecioTotal = detalle.Cantidad * precioBase;
    this.detallesSubject.next([...this.detalles]);
  } else if (detalle && detalle.Cantidad === 1) {
    this.eliminarProducto(idProductoTamano);
  }
}

eliminarProducto(idProductoTamano: number) {
  this.detalles = this.detalles.filter(d => d.ID_Producto_T !== idProductoTamano);
  this.detallesSubject.next([...this.detalles]);
}

  // 🧹 Limpiar carrito
  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // 🔹 Total general
  obtenerTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
  }

  // 🔹 Obtener detalles
  obtenerDetalles(): PedidoDetalle[] {
    return [...this.detalles];
  }
}