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
    const existente = this.detalles.find(d => d.ID_Producto === producto.ID_Producto);

    if (existente) {
      existente.Cantidad = (existente.Cantidad || 1) + 1;
      existente.PrecioTotal = (existente.Cantidad || 1) * (producto.Precio_Base || 0);
    } else {
      const nuevo: PedidoDetalle = {
        ID_Pedido_D: 0, // se asignará en el backend
        ID_Pedido: 0,
        ID_Producto: producto.ID_Producto,
        ID_Tamano: 0, // si no aplica, puede omitirse
        Cantidad: 1,
        PrecioTotal: producto.Precio_Base || 0,
        nombre_producto: producto.Nombre || 'Sin nombre',
        nombre_categoria: producto.nombre_categoria || 'Sin categoría'
      };
      this.detalles.push(nuevo);
    }

    this.detallesSubject.next([...this.detalles]);
  }

  // 🟥 Eliminar producto del pedido
  eliminarProducto(id: number) {
    this.detalles = this.detalles.filter(p => p.ID_Producto !== id);
    this.detallesSubject.next([...this.detalles]);
  }

  // 🧹 Limpiar el pedido (vaciar carrito)
  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // ⬆️ Aumentar cantidad de un producto
  aumentarCantidad(id: number, precioBase: number) {
    const detalle = this.detalles.find(d => d.ID_Producto === id);
    if (detalle) {
      detalle.Cantidad = (detalle.Cantidad || 1) + 1;
      detalle.PrecioTotal = (detalle.Cantidad || 1) * precioBase;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  // ⬇️ Reducir cantidad de un producto
  reducirCantidad(id: number, precioBase: number) {
    const detalle = this.detalles.find(d => d.ID_Pedido === id);
    if (detalle && detalle.Cantidad && detalle.Cantidad > 1) {
      detalle.Cantidad -= 1;
      detalle.PrecioTotal = detalle.Cantidad * precioBase;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  // 🔹 Obtener total del pedido
  obtenerTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
  }

  // 🔹 Obtener los detalles actuales
  obtenerDetalles(): PedidoDetalle[] {
    return [...this.detalles];
  }
}
