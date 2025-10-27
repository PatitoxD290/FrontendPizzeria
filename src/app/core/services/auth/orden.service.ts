import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { PedidoDetalle } from '../../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private detalles: PedidoDetalle[] = [];
  private detallesSubject = new BehaviorSubject<PedidoDetalle[]>([]);
  detalles$ = this.detallesSubject.asObservable();

  agregarProducto(producto: Producto & { nombre_categoria?: string }) {
    const existente = this.detalles.find(d => d.id_producto === producto.producto_id);

    if (existente) {
      existente.cantidad += 1;
      existente.precio_total = existente.cantidad * 1;
    } else {
      const nuevo: PedidoDetalle = {
        id_pedido_d: 0,
        id_pedido: 0,
        id_producto: producto.producto_id!,
        id_tamano: 0,
        cantidad: 1,
        precio_total: producto.precio_venta,
        nombre_producto: producto.nombre_producto,
        nombre_categoria: producto.nombre_categoria || 'Sin categoría'
      };
      this.detalles.push(nuevo);
    }

    this.detallesSubject.next([...this.detalles]);
  }

  eliminarProducto(id: number) {
    this.detalles = this.detalles.filter(p => p.id_producto !== id);
    this.detallesSubject.next([...this.detalles]);
  }

  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // 🔹 NUEVOS MÉTODOS PÚBLICOS
  aumentarCantidad(id: number) {
    const detalle = this.detalles.find(d => d.id_producto === id);
    if (detalle) {
      detalle.cantidad += 1;
      detalle.precio_total = detalle.cantidad * 1;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  reducirCantidad(id: number) {
    const detalle = this.detalles.find(d => d.id_producto === id);
    if (detalle && detalle.cantidad > 1) {
      detalle.cantidad -= 1;
      detalle.precio_total = detalle.cantidad * 1;
      this.detallesSubject.next([...this.detalles]);
    }
  }
}