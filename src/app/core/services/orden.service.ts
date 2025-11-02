// src/app/dashboard/services/orden.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto.model';
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

  const existente = this.detalles.find(
    d => d.ID_Producto === detalle.ID_Producto && d.ID_Tamano === detalle.ID_Tamano
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
aumentarCantidad(idProducto: number, idTamano: number, precioBase: number) {
  const detalle = this.detalles.find(d => d.ID_Producto === idProducto && d.ID_Tamano === idTamano);
  if (detalle) {
    detalle.Cantidad++;
    detalle.PrecioTotal = detalle.Cantidad * precioBase;
    this.detallesSubject.next([...this.detalles]);
  }
}

// ⬇️ Reducir cantidad
reducirCantidad(idProducto: number, idTamano: number, precioBase: number) {
  const detalle = this.detalles.find(d => d.ID_Producto === idProducto && d.ID_Tamano === idTamano);
  if (detalle && detalle.Cantidad > 1) {
    detalle.Cantidad--;
    detalle.PrecioTotal = detalle.Cantidad * precioBase;
    this.detallesSubject.next([...this.detalles]);
  } else if (detalle && detalle.Cantidad === 1) {
    this.eliminarProducto(idProducto, idTamano);
  }
}

// 🟥 Eliminar producto con tamaño
eliminarProducto(idProducto: number, idTamano: number) {
  this.detalles = this.detalles.filter(d => !(d.ID_Producto === idProducto && d.ID_Tamano === idTamano));
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
