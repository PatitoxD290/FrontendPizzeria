// src/app/dashboard/services/orden.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto.model';
import { PedidoDetalle } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private detalles: PedidoDetalle[] = [];
  private detallesSubject = new BehaviorSubject<PedidoDetalle[]>([]);
  detalles$ = this.detallesSubject.asObservable();

  constructor() {}

  // 🟩 Agregar producto al pedido
  agregarProducto(producto: Producto & { nombre_categoria?: string }) {
    const existente = this.detalles.find(d => d.id_producto === producto.id_producto);

    if (existente) {
      existente.cantidad = (existente.cantidad || 1) + 1;
      existente.precio_total = (existente.cantidad || 1) * (producto.precio_base || 0);
    } else {
      const nuevo: PedidoDetalle = {
        id_pedido_d: 0, // se asignará en el backend
        id_pedido: 0,
        id_producto: producto.id_producto,
        id_tamano: 0, // si no aplica, puede omitirse
        cantidad: 1,
        precio_total: producto.precio_base || 0,
        nombre_producto: producto.nombre || 'Sin nombre',
        nombre_categoria: producto.nombre_categoria || 'Sin categoría'
      };
      this.detalles.push(nuevo);
    }

    this.detallesSubject.next([...this.detalles]);
  }

  // 🟥 Eliminar producto del pedido
  eliminarProducto(id: number) {
    this.detalles = this.detalles.filter(p => p.id_producto !== id);
    this.detallesSubject.next([...this.detalles]);
  }

  // 🧹 Limpiar el pedido (vaciar carrito)
  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // ⬆️ Aumentar cantidad de un producto
  aumentarCantidad(id: number, precioBase: number) {
    const detalle = this.detalles.find(d => d.id_producto === id);
    if (detalle) {
      detalle.cantidad = (detalle.cantidad || 1) + 1;
      detalle.precio_total = (detalle.cantidad || 1) * precioBase;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  // ⬇️ Reducir cantidad de un producto
  reducirCantidad(id: number, precioBase: number) {
    const detalle = this.detalles.find(d => d.id_producto === id);
    if (detalle && detalle.cantidad && detalle.cantidad > 1) {
      detalle.cantidad -= 1;
      detalle.precio_total = detalle.cantidad * precioBase;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  // 🔹 Obtener total del pedido
  obtenerTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.precio_total || 0), 0);
  }

  // 🔹 Obtener los detalles actuales
  obtenerDetalles(): PedidoDetalle[] {
    return [...this.detalles];
  }
}
